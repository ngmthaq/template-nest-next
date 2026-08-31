'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

export type ScriptStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface UseScriptOptions {
  enabled?: boolean;
  removeOnUnmount?: boolean;
  async?: boolean;
  defer?: boolean;
  crossOrigin?: 'anonymous' | 'use-credentials';
  integrity?: string;
  referrerPolicy?: ReferrerPolicy;
  attributes?: Record<string, string>;
}

interface ScriptEntry {
  element: HTMLScriptElement;
  status: Exclude<ScriptStatus, 'idle'>;
  listeners: Set<() => void>;
}

type ScriptAttributes = Omit<UseScriptOptions, 'enabled' | 'removeOnUnmount'>;

const registry = new Map<string, ScriptEntry>();

function settle(entry: ScriptEntry, status: ScriptEntry['status']) {
  entry.status = status;
  for (const listener of entry.listeners) listener();
}

function ensureEntry(src: string, options: ScriptAttributes): ScriptEntry {
  const cached = registry.get(src);
  if (cached) return cached;

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${CSS.escape(src)}"]`);

  const element = existing ?? document.createElement('script');
  const entry: ScriptEntry = {
    element,
    status: existing ? 'ready' : 'loading',
    listeners: new Set(),
  };
  registry.set(src, entry);

  element.addEventListener('load', () => settle(entry, 'ready'));
  element.addEventListener('error', () => settle(entry, 'error'));

  if (!existing) {
    element.src = src;
    element.async = options.async ?? true;
    if (options.defer !== undefined) element.defer = options.defer;
    if (options.crossOrigin) element.crossOrigin = options.crossOrigin;
    if (options.integrity) element.integrity = options.integrity;
    if (options.referrerPolicy) element.referrerPolicy = options.referrerPolicy;

    for (const [key, value] of Object.entries(options.attributes ?? {})) {
      element.setAttribute(key, value);
    }

    document.body.appendChild(element);
  }

  return entry;
}

export function useScript(src: string | null, options: UseScriptOptions = {}): ScriptStatus {
  const {
    enabled = true,
    removeOnUnmount = false,
    async,
    defer,
    crossOrigin,
    integrity,
    referrerPolicy,
    attributes,
  } = options;

  const isActive = enabled && Boolean(src);

  const attributesRef = useRef(attributes);

  useEffect(() => {
    attributesRef.current = attributes;
  });

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!src || !isActive) return () => {};

      const entry = ensureEntry(src, {
        async,
        defer,
        crossOrigin,
        integrity,
        referrerPolicy,
        attributes: attributesRef.current,
      });
      entry.listeners.add(onChange);

      return () => {
        entry.listeners.delete(onChange);
        if (removeOnUnmount && entry.listeners.size === 0) {
          entry.element.remove();
          registry.delete(src);
        }
      };
    },
    [src, isActive, async, defer, crossOrigin, integrity, referrerPolicy, removeOnUnmount],
  );

  const getSnapshot = useCallback((): ScriptStatus => {
    if (!src || !isActive) return 'idle';
    return registry.get(src)?.status ?? 'loading';
  }, [src, isActive]);

  const getServerSnapshot = useCallback(
    (): ScriptStatus => (isActive ? 'loading' : 'idle'),
    [isActive],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
