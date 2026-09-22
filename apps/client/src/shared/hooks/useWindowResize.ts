'use client';

import { useCallback, useSyncExternalStore } from 'react';

export interface WindowSize {
  width: number;
  height: number;
}

export interface UseWindowResizeOptions {
  debounceMs?: number;
}

const SERVER_SIZE: WindowSize = { width: 0, height: 0 };
let cachedSize: WindowSize = SERVER_SIZE;

function getSnapshot(): WindowSize {
  const width = document.documentElement.clientWidth;
  const height = document.documentElement.clientHeight;

  if (cachedSize.width !== width || cachedSize.height !== height) {
    cachedSize = { width, height };
  }

  return cachedSize;
}

function getServerSnapshot(): WindowSize {
  return SERVER_SIZE;
}

export function useWindowResize(options: UseWindowResizeOptions = {}): WindowSize {
  const { debounceMs = 0 } = options;

  const subscribe = useCallback(
    (onChange: () => void) => {
      let frameId: number | null = null;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const schedule = () => {
        if (debounceMs > 0) {
          if (timeoutId !== null) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            timeoutId = null;
            onChange();
          }, debounceMs);
          return;
        }

        if (frameId !== null) return;
        frameId = requestAnimationFrame(() => {
          frameId = null;
          onChange();
        });
      };

      window.addEventListener('resize', schedule);
      window.addEventListener('orientationchange', schedule);

      return () => {
        window.removeEventListener('resize', schedule);
        window.removeEventListener('orientationchange', schedule);
        if (frameId !== null) cancelAnimationFrame(frameId);
        if (timeoutId !== null) clearTimeout(timeoutId);
      };
    },
    [debounceMs],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
