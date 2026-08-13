// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const navigationMocks = vi.hoisted(() => ({
  useSearchParams: vi.fn(),
}));

const querySyncMocks = vi.hoisted(() => ({
  useQuerySync: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: navigationMocks.useSearchParams,
}));

vi.mock('@shared/hooks/useQuerySync', () => ({
  useQuerySync: querySyncMocks.useQuerySync,
}));

import { useFeedSearch } from './useFeedSearch';

type QueryMutation = (params: URLSearchParams) => void;

const advance = async (milliseconds: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
};

describe('useFeedSearch', () => {
  const updateQuery = vi.fn();
  let searchParams: URLSearchParams;

  beforeEach(() => {
    vi.useFakeTimers();
    searchParams = new URLSearchParams();
    navigationMocks.useSearchParams.mockImplementation(() => searchParams);
    querySyncMocks.useQuerySync.mockReturnValue(updateQuery);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const applyUpdate = (base = searchParams) => {
    expect(updateQuery).toHaveBeenCalledOnce();
    const [mutate] = updateQuery.mock.calls[0] as [QueryMutation];
    const next = new URLSearchParams(base);

    mutate(next);

    return next;
  };

  it('starts with the title from the URL', () => {
    searchParams = new URLSearchParams({
      filter: 'friends',
      title: 'birthday cake',
    });

    const { result } = renderHook(() => useFeedSearch());

    expect(result.current.value).toBe('birthday cake');
  });

  it('trims and commits a change after 500 ms', async () => {
    searchParams = new URLSearchParams({
      filter: 'friends',
      event: '42',
    });

    const { result } = renderHook(() => useFeedSearch());

    act(() => result.current.onChange('  birthday cake  '));

    expect(result.current.value).toBe('  birthday cake  ');

    await advance(499);
    expect(updateQuery).not.toHaveBeenCalled();

    await advance(1);

    const next = applyUpdate();

    expect(next.toString()).toBe('filter=friends&event=42&title=birthday+cake');
  });

  it('restarts the debounce when the user keeps typing', async () => {
    const { result } = renderHook(() => useFeedSearch());

    act(() => result.current.onChange('birth'));
    await advance(300);
    act(() => result.current.onChange('birthday'));
    await advance(499);

    expect(updateQuery).not.toHaveBeenCalled();

    await advance(1);

    const next = applyUpdate();

    expect(next.get('title')).toBe('birthday');
  });

  it('removes the title parameter for a blank search', async () => {
    searchParams = new URLSearchParams({
      filter: 'plans',
      title: 'old title',
    });

    const { result } = renderHook(() => useFeedSearch());

    act(() => result.current.onChange('   '));
    await advance(500);

    const next = applyUpdate();

    expect(next.toString()).toBe('filter=plans');
  });

  it('commits immediately on search and cancels the debounce timer', async () => {
    const { result } = renderHook(() => useFeedSearch());

    act(() => result.current.onChange('party'));
    await advance(200);
    act(() => result.current.onSearch('  party tonight  '));

    expect(applyUpdate().get('title')).toBe('party tonight');

    await advance(500);
    expect(updateQuery).toHaveBeenCalledOnce();
  });

  it('follows a back or forward URL change and cancels the old draft', async () => {
    searchParams = new URLSearchParams({ title: 'first search' });
    const { result, rerender } = renderHook(() => useFeedSearch());

    act(() => result.current.onChange('local draft'));
    await advance(200);

    searchParams = new URLSearchParams({
      filter: 'wishes',
      title: 'search from history',
    });
    rerender();

    expect(result.current.value).toBe('search from history');

    await advance(500);
    expect(updateQuery).not.toHaveBeenCalled();
  });

  it('does not commit a pending search after unmount', async () => {
    const { result, unmount } = renderHook(() => useFeedSearch());

    act(() => result.current.onChange('party'));
    unmount();
    await advance(500);

    expect(updateQuery).not.toHaveBeenCalled();
  });
});
