'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

export type StyleStatus = 'idle' | 'loading' | 'ready' | 'error';

export type StyleSource = { href: string; css?: never } | { css: string; href?: never };

export interface UseStyleOptions {
  enabled?: boolean;
  removeOnUnmount?: boolean;
  media?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
  integrity?: string;
  attributes?: Record<string, string>;
}

interface SheetEntry {
  element: HTMLLinkElement;
  status: Exclude<StyleStatus, 'idle'>;
  listeners: Set<() => void>;
}

type SheetOptions = Pick<UseStyleOptions, 'media' | 'crossOrigin' | 'integrity' | 'attributes'>;

const registry = new Map<string, SheetEntry>();

function settle(entry: SheetEntry, status: SheetEntry['status']) {
  entry.status = status;
  for (const listener of entry.listeners) listener();
}

function applyAttributes(
  element: HTMLStyleElement | HTMLLinkElement,
  { media, attributes }: SheetOptions,
) {
  if (media) element.media = media;
  for (const [key, value] of Object.entries(attributes ?? {})) element.setAttribute(key, value);
}

function ensureEntry(href: string, options: SheetOptions): SheetEntry {
  const cached = registry.get(href);
  if (cached) return cached;

  const selector = `link[rel="stylesheet"][href="${CSS.escape(href)}"]`;
  const existing = document.querySelector<HTMLLinkElement>(selector);

  const element = existing ?? document.createElement('link');
  const entry: SheetEntry = {
    element,
    status: existing ? 'ready' : 'loading',
    listeners: new Set(),
  };

  registry.set(href, entry);
  element.addEventListener('load', () => settle(entry, 'ready'));
  element.addEventListener('error', () => settle(entry, 'error'));

  if (!existing) {
    element.rel = 'stylesheet';
    element.href = href;
    if (options.crossOrigin) element.crossOrigin = options.crossOrigin;
    if (options.integrity) element.integrity = options.integrity;
    applyAttributes(element, options);
    document.head.appendChild(element);
  }

  return entry;
}

export function useStyle(source: StyleSource | null, options: UseStyleOptions = {}): StyleStatus {
  const { enabled = true, removeOnUnmount, media, crossOrigin, integrity, attributes } = options;

  const href = source?.href ?? null;
  const css = source?.css ?? null;
  const isActive = enabled && Boolean(href ?? css);

  const attributesRef = useRef(attributes);
  const attributesKey = attributes ? JSON.stringify(attributes) : '';

  useEffect(() => {
    attributesRef.current = attributes;
  });

  useEffect(() => {
    if (!isActive || href || css === null) return;

    const element = document.createElement('style');
    element.textContent = css;
    applyAttributes(element, { media, attributes: attributesRef.current });
    document.head.appendChild(element);

    return () => {
      if (removeOnUnmount !== false) element.remove();
    };
  }, [isActive, href, css, media, removeOnUnmount, attributesKey]);

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!href || !isActive) return () => {};

      const entry = ensureEntry(href, {
        media,
        crossOrigin,
        integrity,
        attributes: attributesRef.current,
      });
      entry.listeners.add(onChange);

      return () => {
        entry.listeners.delete(onChange);
        if (removeOnUnmount === true && entry.listeners.size === 0) {
          entry.element.remove();
          registry.delete(href);
        }
      };
    },
    [href, isActive, media, crossOrigin, integrity, removeOnUnmount],
  );

  const getSnapshot = useCallback((): StyleStatus => {
    if (!isActive) return 'idle';
    if (!href) return 'ready';
    return registry.get(href)?.status ?? 'loading';
  }, [href, isActive]);

  const getServerSnapshot = useCallback((): StyleStatus => {
    if (!isActive) return 'idle';
    return href ? 'loading' : 'ready';
  }, [href, isActive]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
