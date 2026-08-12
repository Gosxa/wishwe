// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Profile } from '@/shared/client_api/auth/types';
import type { Paginated } from '@/shared/client_api/event';

const apiMocks = vi.hoisted(() => ({
  searchProfiles: vi.fn(),
}));

vi.mock('@/shared/client_api/user', () => ({
  searchProfiles: apiMocks.searchProfiles,
}));

import { useUserSearch } from './useUserSearch';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

const deferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

const profile = (
  userId: number,
  username: string | null,
  firstName: string | null = null,
  lastName: string | null = null,
): Profile => ({
  id: userId + 100,
  user: `user-${userId}`,
  user_id: userId,
  username,
  first_name: firstName,
  last_name: lastName,
  bio: null,
  date_of_birth: null,
  city: null,
  gender: null,
  avatar: null,
  social_media_url: null,
  is_private: false,
  has_seen_feed_tour: true,
});

const page = (
  results: Profile[],
  next: string | null = null,
): Paginated<Profile> => ({
  count: results.length,
  next,
  previous: null,
  results,
});

const advance = async (milliseconds: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
};

const resolveRequest = async <T>(request: Deferred<T>, value: T) => {
  await act(async () => {
    request.resolve(value);
    await request.promise;
  });
};

describe('useUserSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    apiMocks.searchProfiles.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('trims, debounces, and maps a settled search', async () => {
    apiMocks.searchProfiles.mockResolvedValueOnce(
      page([profile(1, 'alice', 'Alice', 'Stone')], '/profiles?page=2'),
    );

    const { result } = renderHook(() => useUserSearch('  alice  '));

    expect(result.current).toEqual({
      results: [],
      hasMore: false,
      isSearching: true,
      error: null,
    });

    await advance(349);
    expect(apiMocks.searchProfiles).not.toHaveBeenCalled();

    await advance(1);

    expect(apiMocks.searchProfiles).toHaveBeenCalledWith('alice');
    expect(result.current).toEqual({
      results: [
        {
          userId: 1,
          username: 'alice',
          name: 'Alice Stone',
          avatar: null,
        },
      ],
      hasMore: true,
      isSearching: false,
      error: null,
    });
  });

  it('restarts the debounce when the trimmed query changes', async () => {
    apiMocks.searchProfiles.mockResolvedValue(page([]));

    const { rerender } = renderHook(
      ({ query }: { query: string }) => useUserSearch(query),
      { initialProps: { query: 'ali' } },
    );

    await advance(200);
    rerender({ query: 'bob' });
    await advance(349);

    expect(apiMocks.searchProfiles).not.toHaveBeenCalled();

    await advance(1);

    expect(apiMocks.searchProfiles.mock.calls).toEqual([['bob']]);
  });

  it('keeps settled results visible while a newer search is pending', async () => {
    apiMocks.searchProfiles.mockResolvedValueOnce(
      page([profile(1, 'alice')], '/profiles?page=2'),
    );

    const { result, rerender } = renderHook(
      ({ query }: { query: string }) => useUserSearch(query),
      { initialProps: { query: 'alice' } },
    );

    await advance(350);

    expect(result.current.results.map(item => item.username)).toEqual([
      'alice',
    ]);
    expect(result.current.hasMore).toBe(true);

    rerender({ query: 'bob' });

    expect(result.current.results.map(item => item.username)).toEqual([
      'alice',
    ]);
    expect(result.current.isSearching).toBe(true);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('ignores an older response after a newer query settles', async () => {
    const oldRequest = deferred<Paginated<Profile>>();
    const newRequest = deferred<Paginated<Profile>>();

    apiMocks.searchProfiles
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(newRequest.promise);

    const { result, rerender } = renderHook(
      ({ query }: { query: string }) => useUserSearch(query),
      { initialProps: { query: 'alice' } },
    );

    await advance(350);
    rerender({ query: 'bob' });
    await advance(350);

    await resolveRequest(newRequest, page([profile(2, 'bob')]));

    expect(result.current.results.map(item => item.username)).toEqual(['bob']);
    expect(result.current.isSearching).toBe(false);

    await resolveRequest(oldRequest, page([profile(1, 'alice')]));

    expect(result.current.results.map(item => item.username)).toEqual(['bob']);
    expect(result.current.isSearching).toBe(false);
  });

  it('clears visible results for a blank query without sending a request', async () => {
    apiMocks.searchProfiles.mockResolvedValueOnce(page([profile(1, 'alice')]));

    const { result, rerender } = renderHook(
      ({ query }: { query: string }) => useUserSearch(query),
      { initialProps: { query: 'alice' } },
    );

    await advance(350);
    expect(result.current.results).toHaveLength(1);

    rerender({ query: '   ' });

    expect(result.current).toEqual({
      results: [],
      hasMore: false,
      isSearching: false,
      error: null,
    });

    await advance(350);
    expect(apiMocks.searchProfiles.mock.calls).toEqual([['alice']]);
  });

  it('reports only the error for the current settled query', async () => {
    apiMocks.searchProfiles.mockRejectedValueOnce(new Error('search failed'));

    const { result } = renderHook(() => useUserSearch('alice'));

    await advance(350);

    expect(result.current).toEqual({
      results: [],
      hasMore: false,
      isSearching: false,
      error: 'Failed to search people',
    });
  });
});
