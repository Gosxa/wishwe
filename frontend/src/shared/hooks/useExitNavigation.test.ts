// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import type { MouseEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const routerMocks = vi.hoisted(() => ({
  prefetch: vi.fn(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => routerMocks,
}));

import { useExitNavigation } from './useExitNavigation';

const createMouseEvent = (
  overrides?: Partial<MouseEvent<HTMLElement>>,
): MouseEvent<HTMLElement> =>
  ({
    altKey: false,
    button: 0,
    ctrlKey: false,
    metaKey: false,
    preventDefault: vi.fn(),
    shiftKey: false,
    ...overrides,
  }) as unknown as MouseEvent<HTMLElement>;

describe('useExitNavigation', () => {
  let reducedMotion = false;

  beforeEach(() => {
    vi.useFakeTimers();
    reducedMotion = false;
    routerMocks.prefetch.mockReset();
    routerMocks.push.mockReset();
    vi.stubGlobal('matchMedia', () => ({ matches: reducedMotion }));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('prefetches the target path on mount', () => {
    renderHook(() => useExitNavigation('/edit-profile'));

    expect(routerMocks.prefetch).toHaveBeenCalledWith('/edit-profile');
  });

  it('plays the exit animation and navigates after duration', () => {
    const { result } = renderHook(() => useExitNavigation('/edit-profile'));
    const event = createMouseEvent();

    act(() => {
      result.current.handleNavigate(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(result.current.isLeaving).toBe(true);
    expect(routerMocks.push).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(319);
    });
    expect(routerMocks.push).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(routerMocks.push).toHaveBeenCalledWith('/edit-profile');
  });

  it('supports custom exit duration', () => {
    const { result } = renderHook(() =>
      useExitNavigation('/edit-profile', { duration: 500 }),
    );
    const event = createMouseEvent();

    act(() => {
      result.current.handleNavigate(event);
    });

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(routerMocks.push).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(routerMocks.push).toHaveBeenCalledWith('/edit-profile');
  });

  it('ignores repeat clicks while already leaving', () => {
    const { result } = renderHook(() => useExitNavigation('/edit-profile'));
    const firstEvent = createMouseEvent();
    const secondEvent = createMouseEvent();

    act(() => {
      result.current.handleNavigate(firstEvent);
      result.current.handleNavigate(secondEvent);
    });

    expect(firstEvent.preventDefault).toHaveBeenCalled();
    expect(secondEvent.preventDefault).toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(320);
    });

    expect(routerMocks.push).toHaveBeenCalledTimes(1);
  });

  it('navigates immediately when reduced motion is preferred', () => {
    reducedMotion = true;
    const { result } = renderHook(() => useExitNavigation('/edit-profile'));
    const event = createMouseEvent();

    act(() => {
      result.current.handleNavigate(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(result.current.isLeaving).toBe(false);
    expect(routerMocks.push).toHaveBeenCalledWith('/edit-profile');
  });

  it('does not prevent default for modified clicks', () => {
    const { result } = renderHook(() => useExitNavigation('/edit-profile'));
    const event = createMouseEvent({ metaKey: true });

    act(() => {
      result.current.handleNavigate(event);
    });

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(result.current.isLeaving).toBe(false);
    expect(routerMocks.push).not.toHaveBeenCalled();
  });

  it('calls onNavigate callback upon navigation', () => {
    const onNavigate = vi.fn();
    const { result } = renderHook(() =>
      useExitNavigation('/edit-profile', { onNavigate }),
    );
    const event = createMouseEvent();

    act(() => {
      result.current.handleNavigate(event);
    });

    expect(onNavigate).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(320);
    });

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(routerMocks.push).toHaveBeenCalledWith('/edit-profile');
  });

  it('clears navigation timeout on unmount', () => {
    const { result, unmount } = renderHook(() =>
      useExitNavigation('/edit-profile'),
    );
    const event = createMouseEvent();

    act(() => {
      result.current.handleNavigate(event);
    });

    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
    expect(routerMocks.push).not.toHaveBeenCalled();
  });
});
