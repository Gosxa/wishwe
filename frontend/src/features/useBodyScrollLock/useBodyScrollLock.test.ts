// @vitest-environment jsdom

import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBodyScrollLock } from './useBodyScrollLock';

describe('useBodyScrollLock', () => {
  const clearStyles = () => {
    for (const property of [
      'position',
      'top',
      'left',
      'right',
      'padding-right',
    ]) {
      document.body.style.removeProperty(property);
    }

    document.documentElement.style.removeProperty('scroll-behavior');
  };

  beforeEach(() => {
    clearStyles();
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 1024,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    clearStyles();
    vi.restoreAllMocks();
  });

  const scrolledTo = (scrollY: number) =>
    Object.defineProperty(window, 'scrollY', {
      value: scrollY,
      configurable: true,
    });

  it('pins the body at the current offset and restores it on unmount', () => {
    scrolledTo(480);
    const { unmount } = renderHook(() => useBodyScrollLock());

    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-480px');
    expect(document.body.style.left).toBe('0px');
    expect(document.body.style.right).toBe('0px');

    unmount();

    expect(document.body.style.position).toBe('');
    expect(document.body.style.top).toBe('');
    expect(document.body.style.left).toBe('');
    expect(document.body.style.right).toBe('');
  });

  it('never hides the root overflow, so sticky headers keep sticking', () => {
    scrolledTo(480);
    const { unmount } = renderHook(() => useBodyScrollLock());

    expect(document.documentElement.style.overflow).toBe('');
    expect(document.body.style.overflow).toBe('');

    unmount();
  });

  it('scrolls back to where the page was, without animating', () => {
    scrolledTo(480);
    document.documentElement.style.scrollBehavior = 'smooth';
    const { unmount } = renderHook(() => useBodyScrollLock());

    unmount();

    expect(window.scrollTo).toHaveBeenCalledWith(0, 480);
    expect(document.documentElement.style.scrollBehavior).toBe('smooth');
  });

  it('holds the width the scrollbar was taking', () => {
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 1009,
      configurable: true,
    });
    document.body.style.paddingRight = '8px';

    const { unmount } = renderHook(() => useBodyScrollLock());

    expect(document.body.style.paddingRight).toBe('23px');

    unmount();

    expect(document.body.style.paddingRight).toBe('8px');
  });

  it('keeps the document locked until the last nested consumer unmounts', () => {
    scrolledTo(200);
    const outer = renderHook(() => useBodyScrollLock());
    const inner = renderHook(() => useBodyScrollLock());

    expect(document.body.style.position).toBe('fixed');

    outer.unmount();

    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-200px');

    inner.unmount();

    expect(document.body.style.position).toBe('');
  });

  it('locks scrolling only while enabled', () => {
    scrolledTo(120);
    const { rerender, unmount } = renderHook(
      ({ enabled }) => useBodyScrollLock(enabled),
      { initialProps: { enabled: false } },
    );

    expect(document.body.style.position).toBe('');

    rerender({ enabled: true });
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-120px');

    rerender({ enabled: false });
    expect(document.body.style.position).toBe('');

    unmount();
    expect(document.body.style.position).toBe('');
  });
});
