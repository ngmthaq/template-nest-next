import { act, renderHook } from '@testing-library/react';

import { useCopyToClipboard } from './useCopyToClipboard';

function stubClipboard(clipboard: Partial<Clipboard> | undefined) {
  Object.defineProperty(navigator, 'clipboard', {
    value: clipboard,
    configurable: true,
  });
}

describe('useCopyToClipboard', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('copies text and sets copiedText and isCopied on success', async () => {
    // Arrange
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ writeText });
    const { result } = renderHook(() => useCopyToClipboard());

    // Act
    await act(async () => {
      await result.current.copy('hello world');
    });

    // Assert
    expect(result.current.copiedText).toBe('hello world');
    expect(result.current.isCopied).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('auto-clears the copied text after the default 2000ms delay', async () => {
    // Arrange
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ writeText });
    const { result } = renderHook(() => useCopyToClipboard());
    await act(async () => {
      await result.current.copy('hello world');
    });

    // Act
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Assert
    expect(result.current.copiedText).toBeNull();
    expect(result.current.isCopied).toBe(false);
  });

  it('sets an error and returns false when the clipboard API is unavailable', async () => {
    // Arrange
    stubClipboard(undefined);
    const { result } = renderHook(() => useCopyToClipboard());

    // Act
    let copyResult: boolean | undefined;
    await act(async () => {
      copyResult = await result.current.copy('hello world');
    });

    // Assert
    expect(copyResult).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.copiedText).toBeNull();
  });

  it('skips the auto-clear timer when resetDelay is zero or below', async () => {
    // Arrange
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ writeText });
    const { result } = renderHook(() => useCopyToClipboard({ resetDelay: 0 }));
    await act(async () => {
      await result.current.copy('hello world');
    });

    // Act
    act(() => {
      vi.advanceTimersByTime(100_000);
    });

    // Assert
    expect(result.current.copiedText).toBe('hello world');
  });

  it('clears the timer and both states when reset is called', async () => {
    // Arrange
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ writeText });
    const { result } = renderHook(() => useCopyToClipboard());
    await act(async () => {
      await result.current.copy('hello world');
    });

    // Act
    act(() => {
      result.current.reset();
    });

    // Assert
    expect(result.current.copiedText).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('does not update state after the component unmounts', async () => {
    // Arrange
    let resolveWrite: () => void = () => {};
    const writeText = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveWrite = resolve;
        }),
    );
    stubClipboard({ writeText });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result, unmount } = renderHook(() => useCopyToClipboard());

    // Act
    let copyPromise: Promise<boolean> = Promise.resolve(false);
    act(() => {
      copyPromise = result.current.copy('hello world');
    });
    unmount();
    await act(async () => {
      resolveWrite();
      await copyPromise;
    });

    // Assert
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
