// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useResendTimer } from './useResendTimer';

describe('useResendTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('counts down from 60 and stops at zero', () => {
    const { result } = renderHook(() => useResendTimer());

    expect(result.current.seconds).toBe(60);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.seconds).toBe(59);

    act(() => vi.advanceTimersByTime(59_000));
    expect(result.current.seconds).toBe(0);

    act(() => vi.advanceTimersByTime(5_000));
    expect(result.current.seconds).toBe(0);
  });

  it('restarts and resets the countdown', () => {
    const { result } = renderHook(() => useResendTimer());

    act(() => vi.advanceTimersByTime(10_000));
    expect(result.current.seconds).toBe(50);

    act(() => result.current.start());
    expect(result.current.seconds).toBe(60);

    act(() => vi.advanceTimersByTime(2_000));
    expect(result.current.seconds).toBe(58);

    act(() => result.current.reset());
    expect(result.current.seconds).toBe(60);

    act(() => vi.advanceTimersByTime(2_000));
    expect(result.current.seconds).toBe(60);
  });

  it('cleans up its interval on unmount', () => {
    const { unmount } = renderHook(() => useResendTimer());

    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
