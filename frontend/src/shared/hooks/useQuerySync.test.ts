// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const navigationMocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: navigationMocks.usePathname,
  useRouter: navigationMocks.useRouter,
  useSearchParams: navigationMocks.useSearchParams,
}));

import { useQuerySync } from './useQuerySync';

describe('useQuerySync', () => {
  const push = vi.fn();
  const replace = vi.fn();
  let pathname: string;
  let query: string;

  beforeEach(() => {
    pathname = '/feed';
    query = 'filter=plans&event=42';

    navigationMocks.usePathname.mockImplementation(() => pathname);
    navigationMocks.useRouter.mockReturnValue({ push, replace });
    navigationMocks.useSearchParams.mockImplementation(
      () => new URLSearchParams(query),
    );
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('replaces the URL by default and preserves existing parameters', () => {
    const { result } = renderHook(() => useQuerySync());

    act(() => {
      result.current(params => params.set('title', 'birthday cake'));
    });

    expect(replace).toHaveBeenCalledWith(
      '/feed?filter=plans&event=42&title=birthday+cake',
      { scroll: false },
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('uses push mode when the caller requests a history entry', () => {
    const { result } = renderHook(() => useQuerySync());

    act(() => {
      result.current(params => params.set('sort', 'soonest'), 'push');
    });

    expect(push).toHaveBeenCalledWith(
      '/feed?filter=plans&event=42&sort=soonest',
      { scroll: false },
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it('uses the pathname without a question mark after the last parameter is removed', () => {
    query = 'title=party';
    const { result } = renderHook(() => useQuerySync());

    act(() => {
      result.current(params => params.delete('title'));
    });

    expect(replace).toHaveBeenCalledWith('/feed', { scroll: false });
  });

  it('does not navigate when a mutation makes no change', () => {
    const { result } = renderHook(() => useQuerySync());

    act(() => {
      result.current(params => params.set('filter', 'plans'));
    });

    expect(push).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('combines consecutive updates before the first URL change settles', () => {
    const { result } = renderHook(() => useQuerySync());

    act(() => {
      result.current(params => params.set('title', 'party'));
      result.current(params => params.set('sort', 'soonest'));
    });

    expect(replace.mock.calls).toEqual([
      ['/feed?filter=plans&event=42&title=party', { scroll: false }],
      [
        '/feed?filter=plans&event=42&title=party&sort=soonest',
        { scroll: false },
      ],
    ]);
  });

  it('starts from the settled URL after navigation completes', () => {
    const { result, rerender } = renderHook(() => useQuerySync());

    act(() => {
      result.current(params => params.set('title', 'party'));
    });

    query = 'filter=plans&event=42&title=party';
    rerender();
    replace.mockClear();

    act(() => {
      result.current(params => {
        params.delete('event');
        params.set('sort', 'recent');
      });
    });

    expect(replace).toHaveBeenCalledWith(
      '/feed?filter=plans&title=party&sort=recent',
      { scroll: false },
    );
  });

  it('drops a stale pending update after a back or forward URL change', () => {
    const { result, rerender } = renderHook(() => useQuerySync());

    act(() => {
      result.current(params => params.set('title', 'local draft'));
    });

    query = 'filter=wishes&sort=soonest';
    rerender();
    replace.mockClear();

    act(() => {
      result.current(params => params.set('event', '99'));
    });

    expect(replace).toHaveBeenCalledWith(
      '/feed?filter=wishes&sort=soonest&event=99',
      { scroll: false },
    );
  });

  it('clears a pending update when its last consumer unmounts', () => {
    const first = renderHook(() => useQuerySync());

    act(() => {
      first.result.current(params => params.set('title', 'old'));
    });

    first.unmount();
    replace.mockClear();

    const second = renderHook(() => useQuerySync());

    act(() => {
      second.result.current(params => params.set('sort', 'soonest'));
    });

    expect(replace).toHaveBeenCalledWith(
      '/feed?filter=plans&event=42&sort=soonest',
      { scroll: false },
    );
  });

  it('shares pending updates between mounted consumers', () => {
    const first = renderHook(() => useQuerySync());
    const second = renderHook(() => useQuerySync());

    act(() => {
      first.result.current(params => params.set('title', 'party'));
    });

    first.unmount();
    replace.mockClear();

    act(() => {
      second.result.current(params => params.set('sort', 'soonest'));
    });

    expect(replace).toHaveBeenCalledWith(
      '/feed?filter=plans&event=42&title=party&sort=soonest',
      { scroll: false },
    );
  });

  it('uses the new pathname and query after a page change', () => {
    const { result, rerender } = renderHook(() => useQuerySync());

    act(() => {
      result.current(params => params.set('title', 'feed search'));
    });

    pathname = '/profile';
    query = 'filter=archive';
    rerender();
    replace.mockClear();

    act(() => {
      result.current(params => params.set('title', 'profile search'));
    });

    expect(replace).toHaveBeenCalledWith(
      '/profile?filter=archive&title=profile+search',
      { scroll: false },
    );
  });
});
