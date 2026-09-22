import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { useScript } from './useScript';

function queryScript(src: string): HTMLScriptElement | null {
  return document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
}

describe('useScript', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('resolves to ready for a pre-existing script and writes no attributes', () => {
    // Arrange
    const src = 'https://example.com/scripts/pre-existing.js';
    const existing = document.createElement('script');
    existing.src = src;
    existing.async = false;
    document.body.appendChild(existing);

    // Act
    const { result } = renderHook(() => useScript(src));

    // Assert
    expect(result.current).toBe('ready');
    expect(existing.async).toBe(false);
  });

  it('creates a new script element with the src and defaults async to true', () => {
    // Arrange
    const src = 'https://example.com/scripts/new-default.js';

    // Act
    renderHook(() => useScript(src));

    // Assert
    const element = queryScript(src);
    expect(element).not.toBeNull();
    expect(element?.async).toBe(true);
  });

  it('applies defer, crossOrigin, integrity, referrerPolicy, and custom attributes to a new script', () => {
    // Arrange
    const src = 'https://example.com/scripts/new-attributes.js';

    // Act
    renderHook(() =>
      useScript(src, {
        defer: true,
        crossOrigin: 'anonymous',
        integrity: 'sha384-abc',
        referrerPolicy: 'no-referrer',
        attributes: { 'data-widget': 'chat' },
      }),
    );

    // Assert
    const element = queryScript(src);
    expect(element?.defer).toBe(true);
    expect(element?.crossOrigin).toBe('anonymous');
    expect(element?.integrity).toBe('sha384-abc');
    expect(element?.referrerPolicy).toBe('no-referrer');
    expect(element?.getAttribute('data-widget')).toBe('chat');
  });

  it('transitions to ready when the script load event fires', () => {
    // Arrange
    const src = 'https://example.com/scripts/loads.js';
    const { result } = renderHook(() => useScript(src));
    const element = queryScript(src);

    // Act
    act(() => {
      element?.dispatchEvent(new Event('load'));
    });

    // Assert
    expect(result.current).toBe('ready');
  });

  it('transitions to error when the script error event fires', () => {
    // Arrange
    const src = 'https://example.com/scripts/errors.js';
    const { result } = renderHook(() => useScript(src));
    const element = queryScript(src);

    // Act
    act(() => {
      element?.dispatchEvent(new Event('error'));
    });

    // Assert
    expect(result.current).toBe('error');
  });

  it('keeps the script element mounted while another consumer is still subscribed', () => {
    // Arrange
    const src = 'https://example.com/scripts/shared-keep.js';
    const first = renderHook(() => useScript(src, { removeOnUnmount: true }));
    renderHook(() => useScript(src, { removeOnUnmount: true }));

    // Act
    first.unmount();

    // Assert
    expect(queryScript(src)).not.toBeNull();
  });

  it('removes the script element and registry entry once the last consumer unmounts', () => {
    // Arrange
    const src = 'https://example.com/scripts/shared-remove.js';
    const first = renderHook(() => useScript(src, { removeOnUnmount: true }));
    const second = renderHook(() => useScript(src, { removeOnUnmount: true }));
    first.unmount();

    // Act
    second.unmount();

    // Assert
    expect(queryScript(src)).toBeNull();
  });

  it('resolves the server snapshot to loading when the script is active', () => {
    // Arrange
    const src = 'https://example.com/scripts/ssr-active.js';
    function Probe() {
      return createElement('div', null, useScript(src));
    }

    // Act
    const html = renderToString(createElement(Probe));

    // Assert
    expect(html).toContain('loading');
  });

  it('resolves the server snapshot to idle when the src is null', () => {
    // Arrange
    function Probe() {
      return createElement('div', null, useScript(null));
    }

    // Act
    const html = renderToString(createElement(Probe));

    // Assert
    expect(html).toContain('idle');
  });
});
