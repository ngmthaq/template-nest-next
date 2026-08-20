'use client';

import { type RefObject, useEffect, useRef } from 'react';

export type ClickOutsideEvent = MouseEvent | TouchEvent | FocusEvent;

export type ClickOutsideTarget = RefObject<HTMLElement | null> | HTMLElement | null;

export interface UseClickOutsideOptions {
  enabled?: boolean;
  detectFocus?: boolean;
}

export function useClickOutside(
  targets: ClickOutsideTarget | ClickOutsideTarget[],
  handler: (event: ClickOutsideEvent) => void,
  options: UseClickOutsideOptions = {},
): void {
  const { enabled = true, detectFocus = false } = options;

  const handlerRef = useRef(handler);
  const targetsRef = useRef(targets);

  useEffect(() => {
    handlerRef.current = handler;
    targetsRef.current = targets;
  });

  useEffect(() => {
    if (!enabled) return;

    const isOutside = (event: ClickOutsideEvent): boolean => {
      const target = event.target;
      if (!(target instanceof Node)) return false;
      if (!target.isConnected) return false;

      const list = Array.isArray(targetsRef.current) ? targetsRef.current : [targetsRef.current];

      return list.every((entry) => {
        const element = entry instanceof HTMLElement ? entry : entry?.current;
        return !element?.contains(target);
      });
    };

    const onEvent = (event: ClickOutsideEvent) => {
      if (isOutside(event)) handlerRef.current(event);
    };

    document.addEventListener('pointerdown', onEvent as EventListener);
    if (detectFocus) document.addEventListener('focusin', onEvent as EventListener);

    return () => {
      document.removeEventListener('pointerdown', onEvent as EventListener);
      if (detectFocus) document.removeEventListener('focusin', onEvent as EventListener);
    };
  }, [enabled, detectFocus]);
}
