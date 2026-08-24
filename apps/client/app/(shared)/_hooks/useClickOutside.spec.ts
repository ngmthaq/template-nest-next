import { act, renderHook } from '@testing-library/react';

import { useClickOutside } from './useClickOutside';

describe('useClickOutside', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('fires the handler on a pointerdown outside the target', () => {
    // Arrange
    const target = document.createElement('div');
    const outside = document.createElement('div');
    document.body.append(target, outside);
    const handler = vi.fn();
    renderHook(() => useClickOutside(target, handler));

    // Act
    act(() => {
      outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    });

    // Assert
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not fire the handler on a pointerdown inside the target', () => {
    // Arrange
    const target = document.createElement('div');
    const child = document.createElement('span');
    target.appendChild(child);
    document.body.appendChild(target);
    const handler = vi.fn();
    renderHook(() => useClickOutside(target, handler));

    // Act
    act(() => {
      child.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    });

    // Assert
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not fire when the event target is not a Node', () => {
    // Arrange
    const target = document.createElement('div');
    document.body.appendChild(target);
    const handler = vi.fn();
    renderHook(() => useClickOutside(target, handler));
    const event = new Event('pointerdown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: {}, configurable: true });

    // Act
    act(() => {
      document.dispatchEvent(event);
    });

    // Assert
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not fire when the event target is not connected to the document', () => {
    // Arrange
    const target = document.createElement('div');
    document.body.appendChild(target);
    const detached = document.createElement('div');
    const handler = vi.fn();
    renderHook(() => useClickOutside(target, handler));
    const event = new Event('pointerdown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: detached, configurable: true });

    // Act
    act(() => {
      document.dispatchEvent(event);
    });

    // Assert
    expect(handler).not.toHaveBeenCalled();
  });

  it('accepts a plain ref object as the target', () => {
    // Arrange
    const target = document.createElement('div');
    const outside = document.createElement('div');
    document.body.append(target, outside);
    const handler = vi.fn();
    const ref = { current: target };
    renderHook(() => useClickOutside(ref, handler));

    // Act
    act(() => {
      outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    });

    // Assert
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('accepts a raw HTMLElement as the target', () => {
    // Arrange
    const target = document.createElement('div');
    const outside = document.createElement('div');
    document.body.append(target, outside);
    const handler = vi.fn();
    renderHook(() => useClickOutside(target, handler));

    // Act
    act(() => {
      outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    });

    // Assert
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('fires only when the pointerdown is outside every target in the list', () => {
    // Arrange
    const first = document.createElement('div');
    const second = document.createElement('div');
    const outside = document.createElement('div');
    document.body.append(first, second, outside);
    const handler = vi.fn();
    renderHook(() => useClickOutside([first, second], handler));

    // Act
    act(() => {
      outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    });

    // Assert
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not fire when the pointerdown lands inside one of multiple targets', () => {
    // Arrange
    const first = document.createElement('div');
    const second = document.createElement('div');
    document.body.append(first, second);
    const handler = vi.fn();
    renderHook(() => useClickOutside([first, second], handler));

    // Act
    act(() => {
      second.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    });

    // Assert
    expect(handler).not.toHaveBeenCalled();
  });

  it('binds no document listener when enabled is false', () => {
    // Arrange
    const target = document.createElement('div');
    document.body.appendChild(target);
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

    // Act
    renderHook(() => useClickOutside(target, vi.fn(), { enabled: false }));

    // Assert
    expect(addEventListenerSpy).not.toHaveBeenCalledWith('pointerdown', expect.any(Function));
  });

  it('removes the pointerdown listener on unmount', () => {
    // Arrange
    const target = document.createElement('div');
    document.body.appendChild(target);
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useClickOutside(target, vi.fn()));

    // Act
    unmount();

    // Assert
    expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
  });

  it('does not re-bind the listener when the handler identity changes across rerenders', () => {
    // Arrange
    const target = document.createElement('div');
    document.body.appendChild(target);
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const { rerender } = renderHook(
      ({ handler }: { handler: () => void }) => useClickOutside(target, handler),
      { initialProps: { handler: vi.fn() } },
    );
    const callCountAfterMount = addEventListenerSpy.mock.calls.length;

    // Act
    rerender({ handler: vi.fn() });

    // Assert
    expect(addEventListenerSpy.mock.calls.length).toBe(callCountAfterMount);
  });
});
