// @vitest-environment jsdom

import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useBodyScrollLock } from './useBodyScrollLock';

describe('useBodyScrollLock', () => {
  beforeEach(() => {
    document.body.style.removeProperty('overflow');
  });

  afterEach(() => {
    cleanup();
    document.body.style.removeProperty('overflow');
  });

  it('locks body scrolling and restores the previous overflow value', () => {
    document.body.style.overflow = 'clip';
    const { unmount } = renderHook(() => useBodyScrollLock());

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('clip');
  });

  it('keeps the body locked until the last nested consumer unmounts', () => {
    document.body.style.overflow = 'scroll';
    const outer = renderHook(() => useBodyScrollLock());
    const inner = renderHook(() => useBodyScrollLock());

    expect(document.body.style.overflow).toBe('hidden');

    outer.unmount();

    expect(document.body.style.overflow).toBe('hidden');

    inner.unmount();

    expect(document.body.style.overflow).toBe('scroll');
  });

  it('also restores an initially unset overflow style', () => {
    const { unmount } = renderHook(() => useBodyScrollLock());

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
  });
});
