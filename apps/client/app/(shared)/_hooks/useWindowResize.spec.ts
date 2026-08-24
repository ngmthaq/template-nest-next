import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { useWindowResize } from './useWindowResize';

function setViewport(width: number, height: number) {
  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: width,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: height,
    configurable: true,
  });
}

describe('useWindowResize', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("reads the initial size from document.documentElement's client dimensions", () => {
    // Arrange
    setViewport(1024, 768);

    // Act
    const { result } = renderHook(() => useWindowResize());

    // Assert
    expect(result.current).toEqual({ width: 1024, height: 768 });
  });

  it('recomputes the size after a resize event once the animation frame runs', () => {
    // Arrange
    setViewport(800, 600);
    let frameCallback: FrameRequestCallback | undefined;
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        frameCallback = cb;
        return 1;
      }),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const { result } = renderHook(() => useWindowResize());

    // Act
    act(() => {
      setViewport(1200, 900);
      window.dispatchEvent(new Event('resize'));
      frameCallback?.(0);
    });

    // Assert
    expect(result.current).toEqual({ width: 1200, height: 900 });
  });

  it('recomputes the size after an orientationchange event', () => {
    // Arrange
    setViewport(800, 600);
    let frameCallback: FrameRequestCallback | undefined;
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        frameCallback = cb;
        return 1;
      }),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const { result } = renderHook(() => useWindowResize());

    // Act
    act(() => {
      setViewport(400, 700);
      window.dispatchEvent(new Event('orientationchange'));
      frameCallback?.(0);
    });

    // Assert
    expect(result.current).toEqual({ width: 400, height: 700 });
  });

  it('schedules only one animation frame for multiple resize events fired before it runs', () => {
    // Arrange
    setViewport(800, 600);
    const rafSpy = vi.fn((_cb: FrameRequestCallback) => 1);
    vi.stubGlobal('requestAnimationFrame', rafSpy);
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    renderHook(() => useWindowResize());

    // Act
    act(() => {
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));
    });

    // Assert
    expect(rafSpy).toHaveBeenCalledTimes(1);
  });

  it('debounces recomputation using a timer when debounceMs is greater than zero', () => {
    // Arrange
    vi.useFakeTimers();
    setViewport(800, 600);
    const { result } = renderHook(() => useWindowResize({ debounceMs: 200 }));

    // Act
    act(() => {
      setViewport(1500, 1000);
      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(199);
    });

    // Assert
    expect(result.current).toEqual({ width: 800, height: 600 });

    // Act
    act(() => {
      vi.advanceTimersByTime(1);
    });

    // Assert
    expect(result.current).toEqual({ width: 1500, height: 1000 });
  });

  it('returns a referentially stable object when the dimensions have not changed', () => {
    // Arrange
    setViewport(640, 480);
    let frameCallback: FrameRequestCallback | undefined;
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        frameCallback = cb;
        return 1;
      }),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const { result } = renderHook(() => useWindowResize());
    const firstReference = result.current;

    // Act
    act(() => {
      window.dispatchEvent(new Event('resize'));
      frameCallback?.(0);
    });

    // Assert
    expect(result.current).toBe(firstReference);
  });

  it('cleans up the resize and orientationchange listeners on unmount', () => {
    // Arrange
    setViewport(800, 600);
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useWindowResize());

    // Act
    unmount();

    // Assert
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));
  });

  it('resolves the server snapshot to the shared zero-size fallback', () => {
    // Arrange
    setViewport(1024, 768);
    function Probe() {
      const size = useWindowResize();
      return createElement('div', null, `${size.width}x${size.height}`);
    }

    // Act
    const html = renderToString(createElement(Probe));

    // Assert
    expect(html).toContain('0x0');
  });
});
