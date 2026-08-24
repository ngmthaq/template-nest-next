import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { useStyle } from './useStyle';

function queryLink(href: string): HTMLLinkElement | null {
  return document.querySelector<HTMLLinkElement>(`link[rel="stylesheet"][href="${href}"]`);
}

describe('useStyle', () => {
  afterEach(() => {
    document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => el.remove());
  });

  it('creates a style element in head with the given css content', () => {
    // Arrange
    // Act
    renderHook(() => useStyle({ css: '.css-create{color:red}' }));

    // Assert
    const style = Array.from(document.head.querySelectorAll('style')).find((el) =>
      el.textContent?.includes('.css-create'),
    );
    expect(style).not.toBeUndefined();
  });

  it('removes the css style element on unmount by default', () => {
    // Arrange
    const { unmount } = renderHook(() => useStyle({ css: '.css-remove-default{color:blue}' }));
    const style = Array.from(document.head.querySelectorAll('style')).find((el) =>
      el.textContent?.includes('.css-remove-default'),
    );
    expect(style).not.toBeUndefined();

    // Act
    unmount();

    // Assert
    expect(style?.isConnected).toBe(false);
  });

  it('keeps the css style element in the DOM when removeOnUnmount is explicitly false', () => {
    // Arrange
    const { unmount } = renderHook(() =>
      useStyle({ css: '.css-keep{color:green}' }, { removeOnUnmount: false }),
    );
    const style = Array.from(document.head.querySelectorAll('style')).find((el) =>
      el.textContent?.includes('.css-keep'),
    );
    expect(style).not.toBeUndefined();

    // Act
    unmount();

    // Assert
    expect(style?.isConnected).toBe(true);
  });

  it('creates a link[rel=stylesheet] element for an href source', () => {
    // Arrange
    const href = 'https://example.com/styles/create.css';

    // Act
    renderHook(() => useStyle({ href }));

    // Assert
    const link = queryLink(href);
    expect(link).not.toBeNull();
    expect(link?.rel).toBe('stylesheet');
  });

  it('keeps the href link element in the DOM after unmount by default', () => {
    // Arrange
    const href = 'https://example.com/styles/keep-default.css';
    const { unmount } = renderHook(() => useStyle({ href }));

    // Act
    unmount();

    // Assert
    expect(queryLink(href)).not.toBeNull();
  });

  it('removes the href link element only when removeOnUnmount is explicitly true', () => {
    // Arrange
    const href = 'https://example.com/styles/remove-explicit.css';
    const { unmount } = renderHook(() => useStyle({ href }, { removeOnUnmount: true }));

    // Act
    unmount();

    // Assert
    expect(queryLink(href)).toBeNull();
  });

  it('transitions to ready when the stylesheet load event fires', () => {
    // Arrange
    const href = 'https://example.com/styles/loads.css';
    const { result } = renderHook(() => useStyle({ href }));
    const link = queryLink(href);

    // Act
    act(() => {
      link?.dispatchEvent(new Event('load'));
    });

    // Assert
    expect(result.current).toBe('ready');
  });

  it('transitions to error when the stylesheet error event fires', () => {
    // Arrange
    const href = 'https://example.com/styles/errors.css';
    const { result } = renderHook(() => useStyle({ href }));
    const link = queryLink(href);

    // Act
    act(() => {
      link?.dispatchEvent(new Event('error'));
    });

    // Assert
    expect(result.current).toBe('error');
  });

  it('keeps the link element mounted while another consumer is still subscribed', () => {
    // Arrange
    const href = 'https://example.com/styles/shared-keep.css';
    const first = renderHook(() => useStyle({ href }, { removeOnUnmount: true }));
    renderHook(() => useStyle({ href }, { removeOnUnmount: true }));

    // Act
    first.unmount();

    // Assert
    expect(queryLink(href)).not.toBeNull();
  });

  it('removes the link element and registry entry once the last consumer unmounts', () => {
    // Arrange
    const href = 'https://example.com/styles/shared-remove.css';
    const first = renderHook(() => useStyle({ href }, { removeOnUnmount: true }));
    const second = renderHook(() => useStyle({ href }, { removeOnUnmount: true }));
    first.unmount();

    // Act
    second.unmount();

    // Assert
    expect(queryLink(href)).toBeNull();
  });

  it('re-runs the effect and reapplies attributes when the attributes value changes', () => {
    // Arrange
    const { rerender } = renderHook(
      ({ mark }: { mark: string }) =>
        useStyle({ css: '.css-attr{color:red}' }, { attributes: { 'data-mark': mark } }),
      { initialProps: { mark: 'first' } },
    );
    expect(document.head.querySelector('style[data-mark="first"]')).not.toBeNull();

    // Act
    rerender({ mark: 'second' });

    // Assert
    expect(document.head.querySelector('style[data-mark="second"]')).not.toBeNull();
    expect(document.head.querySelector('style[data-mark="first"]')).toBeNull();
  });

  it('resolves the server snapshot to ready immediately for a css source', () => {
    // Arrange
    function Probe() {
      return createElement('div', null, useStyle({ css: '.ssr{color:red}' }));
    }

    // Act
    const html = renderToString(createElement(Probe));

    // Assert
    expect(html).toContain('ready');
  });

  it('resolves the server snapshot to loading for an href source', () => {
    // Arrange
    function Probe() {
      return createElement('div', null, useStyle({ href: 'https://example.com/styles/ssr.css' }));
    }

    // Act
    const html = renderToString(createElement(Probe));

    // Assert
    expect(html).toContain('loading');
  });

  it('resolves the server snapshot to idle when the source is null', () => {
    // Arrange
    function Probe() {
      return createElement('div', null, useStyle(null));
    }

    // Act
    const html = renderToString(createElement(Probe));

    // Assert
    expect(html).toContain('idle');
  });
});
