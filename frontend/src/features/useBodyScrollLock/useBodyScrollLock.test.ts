// @vitest-environment jsdom

import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useBodyScrollLock } from './useBodyScrollLock';

describe('useBodyScrollLock', () => {
  beforeEach(() => {
    document.body.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('overflow');
  });

  afterEach(() => {
    cleanup();
    document.body.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('overflow');
  });

  it('locks document scrolling and restores the previous overflow values', () => {
    document.body.style.overflow = 'clip';
    document.documentElement.style.overflow = 'auto';
    const { unmount } = renderHook(() => useBodyScrollLock());

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('clip');
    expect(document.documentElement.style.overflow).toBe('auto');
  });

  it('keeps the document locked until the last nested consumer unmounts', () => {
    document.body.style.overflow = 'scroll';
    const outer = renderHook(() => useBodyScrollLock());
    const inner = renderHook(() => useBodyScrollLock());

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');

    outer.unmount();

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');

    inner.unmount();

    expect(document.body.style.overflow).toBe('scroll');
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('also restores an initially unset overflow style', () => {
    const { unmount } = renderHook(() => useBodyScrollLock());

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('locks scrolling only while enabled', () => {
    document.body.style.overflow = 'scroll';
    const { rerender, unmount } = renderHook(
      ({ enabled }) => useBodyScrollLock(enabled),
      { initialProps: { enabled: false } },
    );

    expect(document.body.style.overflow).toBe('scroll');
    expect(document.documentElement.style.overflow).toBe('');

    rerender({ enabled: true });
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');

    rerender({ enabled: false });
    expect(document.body.style.overflow).toBe('scroll');
    expect(document.documentElement.style.overflow).toBe('');

    unmount();
    expect(document.body.style.overflow).toBe('scroll');
    expect(document.documentElement.style.overflow).toBe('');
  });
});
