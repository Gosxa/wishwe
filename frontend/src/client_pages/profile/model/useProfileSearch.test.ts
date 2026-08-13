// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const navigationMocks = vi.hoisted(() => ({
  useSearchParams: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: navigationMocks.useSearchParams,
}));

import { useProfileSearch } from './useProfileSearch';

const advance = async (milliseconds: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
};

describe('useProfileSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.history.replaceState(null, '', '/profile');
    navigationMocks.useSearchParams.mockImplementation(
      () => new URLSearchParams(window.location.search),
    );
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts with the title from the URL', () => {
    window.history.replaceState(
      null,
      '',
      '/profile?filter=plans&title=birthday+cake',
    );

    const { result } = renderHook(() => useProfileSearch());

    expect(result.current.value).toBe('birthday cake');
  });

  it('trims and replaces the search URL after 500 ms', async () => {
    window.history.replaceState(null, '', '/profile?filter=wishes&event=42');
    const replaceState = vi.spyOn(window.history, 'replaceState');
    const { result } = renderHook(() => useProfileSearch());

    act(() => result.current.onChange('  birthday cake  '));

    expect(result.current.value).toBe('  birthday cake  ');

    await advance(499);
    expect(replaceState).not.toHaveBeenCalled();

    await advance(1);

    expect(replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/profile?filter=wishes&event=42&title=birthday+cake',
    );
    expect(window.location.search).toBe(
      '?filter=wishes&event=42&title=birthday+cake',
    );
  });

  it('restarts the debounce when the user keeps typing', async () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    const { result } = renderHook(() => useProfileSearch());

    act(() => result.current.onChange('birth'));
    await advance(300);
    act(() => result.current.onChange('birthday'));
    await advance(499);

    expect(replaceState).not.toHaveBeenCalled();

    await advance(1);

    expect(window.location.search).toBe('?title=birthday');
    expect(replaceState).toHaveBeenCalledOnce();
  });

  it('removes only the title parameter for a blank search', async () => {
    window.history.replaceState(
      null,
      '',
      '/profile?filter=archive&title=old+title',
    );
    const { result } = renderHook(() => useProfileSearch());

    act(() => result.current.onChange('   '));
    await advance(500);

    expect(window.location.pathname).toBe('/profile');
    expect(window.location.search).toBe('?filter=archive');
  });

  it('commits immediately on search and cancels the debounce timer', async () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    const { result } = renderHook(() => useProfileSearch());

    act(() => result.current.onChange('party'));
    await advance(200);
    act(() => result.current.onSearch('  party tonight  '));

    expect(window.location.search).toBe('?title=party+tonight');
    expect(replaceState).toHaveBeenCalledOnce();

    await advance(500);
    expect(replaceState).toHaveBeenCalledOnce();
  });

  it('follows a back or forward URL change and cancels the old draft', async () => {
    window.history.replaceState(null, '', '/profile?title=first+search');
    const { result, rerender } = renderHook(() => useProfileSearch());

    act(() => result.current.onChange('local draft'));
    await advance(200);

    window.history.replaceState(
      null,
      '',
      '/profile?filter=wishes&title=search+from+history',
    );
    const replaceState = vi.spyOn(window.history, 'replaceState');

    rerender();

    expect(result.current.value).toBe('search from history');

    await advance(500);
    expect(replaceState).not.toHaveBeenCalled();
    expect(window.location.search).toBe(
      '?filter=wishes&title=search+from+history',
    );
  });

  it('does not replace the URL after unmount', async () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    const { result, unmount } = renderHook(() => useProfileSearch());

    act(() => result.current.onChange('party'));
    unmount();
    await advance(500);

    expect(replaceState).not.toHaveBeenCalled();
  });
});
