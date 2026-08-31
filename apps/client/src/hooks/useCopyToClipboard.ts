'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseCopyToClipboardOptions {
  resetDelay?: number;
}

export interface UseCopyToClipboardResult {
  copiedText: string | null;
  isCopied: boolean;
  error: Error | null;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {},
): UseCopyToClipboardResult {
  const { resetDelay = 2000 } = options;

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      clearTimer();
    };
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setCopiedText(null);
    setError(null);
  }, [clearTimer]);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      clearTimer();

      try {
        if (!navigator.clipboard) throw new Error('Clipboard API unavailable in this context');

        await navigator.clipboard.writeText(text);
        if (!isMountedRef.current) return true;

        setCopiedText(text);
        setError(null);
        if (resetDelay > 0) {
          timeoutRef.current = setTimeout(() => {
            timeoutRef.current = null;
            if (isMountedRef.current) setCopiedText(null);
          }, resetDelay);
        }

        return true;
      } catch (cause) {
        if (isMountedRef.current) {
          setCopiedText(null);
          setError(cause instanceof Error ? cause : new Error('Failed to copy'));
        }

        return false;
      }
    },
    [clearTimer, resetDelay],
  );

  return {
    copiedText,
    isCopied: copiedText !== null,
    error,
    copy,
    reset,
  };
}
