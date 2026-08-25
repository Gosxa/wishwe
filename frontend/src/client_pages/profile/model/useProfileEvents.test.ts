// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BackendEvent, Paginated } from '@/shared/client_api/event';
import { useEventsRefreshStore } from '@/shared/store/useEventsRefreshStore';
import type { ProfileSort, ProfileTab } from './types';

const apiMocks = vi.hoisted(() => ({
  listUserEvents: vi.fn(),
}));

const navigationMocks = vi.hoisted(() => ({
  useSearchParams: vi.fn(),
}));

const mapperMocks = vi.hoisted(() => ({
  toFeedEvents: vi.fn(),
}));

vi.mock('@/shared/client_api/user', () => ({
  listUserEvents: apiMocks.listUserEvents,
}));

vi.mock('next/navigation', () => ({
  useSearchParams: navigationMocks.useSearchParams,
}));

vi.mock('@client_pages/home/model/feedMapper', async importOriginal => {
  const actual =
    await importOriginal<
      typeof import('@client_pages/home/model/feedMapper')
    >();

  mapperMocks.toFeedEvents.mockImplementation(actual.toFeedEvents);

  return { ...actual, toFeedEvents: mapperMocks.toFeedEvents };
});

import { useProfileEvents } from './useProfileEvents';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

type HookProps = {
  userId: number | null;
  tab: ProfileTab;
  sort: ProfileSort;
  refreshKey?: number;
  enabled?: boolean;
};

const deferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

const event = (id: number): BackendEvent => ({
  id,
  creator: `profile-${id}`,
  creator_avatar: null,
  mutual_friend: null,
  category: null,
  event_type: 'plan',
  event_visibility: 'public',
  status: 'active',
  title: `Profile event ${id}`,
  description: `Description ${id}`,
  cover_image: null,
  location: `Location ${id}`,
  external_link: null,
  event_date: '2026-09-01',
  event_time: null,
  timeframe_text: null,
  min_participants: 1,
  max_participants: 10,
  participants_count: id,
  interested_count: 0,
  participants_preview: [],
  created_at: `2026-08-${String(id).padStart(2, '0')}T00:00:00Z`,
  is_full: false,
  available_spots: 10 - id,
  user_participation_status: null,
});

const page = (
  ids: number[],
  next: string | null = null,
): Paginated<BackendEvent> => ({
  count: ids.length,
  next,
  previous: null,
  results: ids.map(event),
});

const resolveRequest = async <T>(request: Deferred<T>, value: T) => {
  await act(async () => {
    request.resolve(value);
    await request.promise;
  });
};

const defaultProps: HookProps = {
  userId: 7,
  tab: 'plans',
  sort: 'recent',
  refreshKey: 0,
  enabled: true,
};

describe('useProfileEvents', () => {
  let searchParams: URLSearchParams;

  beforeEach(() => {
    apiMocks.listUserEvents.mockReset();
    navigationMocks.useSearchParams.mockReset();
    mapperMocks.toFeedEvents.mockClear();
    useEventsRefreshStore.setState({
      refreshToken: 0,
      isDeferred: false,
      isPending: false,
      revealEventId: null,
    });

    searchParams = new URLSearchParams();
    navigationMocks.useSearchParams.mockImplementation(() => searchParams);
  });

  afterEach(cleanup);

  it('loads and maps the selected profile page', async () => {
    const request = deferred<Paginated<BackendEvent>>();

    searchParams = new URLSearchParams({ title: 'summer trip' });
    apiMocks.listUserEvents.mockReturnValueOnce(request.promise);

    const props: HookProps = {
      userId: 42,
      tab: 'wishes',
      sort: 'soonest',
      refreshKey: 3,
      enabled: true,
    };
    const { result } = renderHook(() => useProfileEvents(props));

    expect(result.current.isLoading).toBe(true);
    expect(apiMocks.listUserEvents).toHaveBeenCalledWith(42, {
      tab: 'wishes',
      sort: 'soonest',
      title: 'summer trip',
      page: 1,
    });

    await resolveRequest(request, page([1, 2], '/next'));

    expect(result.current.events.map(item => item.id)).toEqual(['1', '2']);
    expect(result.current.events[0].title).toBe('Profile event 1');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('reloads for profile options and search and ignores an older response', async () => {
    const oldRequest = deferred<Paginated<BackendEvent>>();
    const newRequest = deferred<Paginated<BackendEvent>>();

    apiMocks.listUserEvents
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(newRequest.promise);

    const { result, rerender } = renderHook(
      (props: HookProps) => useProfileEvents(props),
      { initialProps: defaultProps },
    );

    searchParams = new URLSearchParams({ title: 'new title' });
    rerender({
      userId: 8,
      tab: 'archive',
      sort: 'soonest',
      refreshKey: 1,
      enabled: true,
    });

    expect(result.current.isLoading).toBe(true);
    expect(apiMocks.listUserEvents).toHaveBeenNthCalledWith(2, 8, {
      tab: 'archive',
      sort: 'soonest',
      title: 'new title',
      page: 1,
    });

    await resolveRequest(newRequest, page([2]));

    expect(result.current.events.map(item => item.id)).toEqual(['2']);

    await resolveRequest(oldRequest, page([1], '/old-next-page'));

    expect(result.current.events.map(item => item.id)).toEqual(['2']);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('reloads when the shared refresh store changes', async () => {
    const initialRequest = deferred<Paginated<BackendEvent>>();
    const refreshRequest = deferred<Paginated<BackendEvent>>();

    apiMocks.listUserEvents
      .mockReturnValueOnce(initialRequest.promise)
      .mockReturnValueOnce(refreshRequest.promise);

    const { result } = renderHook(() => useProfileEvents(defaultProps));

    await resolveRequest(initialRequest, page([1]));

    act(() => useEventsRefreshStore.getState().requestRefresh());

    expect(apiMocks.listUserEvents).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toBe(true);

    await resolveRequest(refreshRequest, page([3]));

    expect(result.current.events.map(item => item.id)).toEqual(['3']);
    expect(result.current.isLoading).toBe(false);
  });

  it('clears old data and reports an initial-page failure', async () => {
    apiMocks.listUserEvents.mockRejectedValueOnce(new Error('network error'));

    const { result } = renderHook(() => useProfileEvents(defaultProps));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.events).toEqual([]);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.error).toBe('Failed to load events');
  });

  it('appends pages and blocks duplicate loadMore requests', async () => {
    const initialRequest = deferred<Paginated<BackendEvent>>();
    const nextRequest = deferred<Paginated<BackendEvent>>();

    apiMocks.listUserEvents
      .mockReturnValueOnce(initialRequest.promise)
      .mockReturnValueOnce(nextRequest.promise);

    const { result } = renderHook(() => useProfileEvents(defaultProps));

    await resolveRequest(initialRequest, page([1, 2], '/next'));

    act(() => {
      result.current.loadMore();
      result.current.loadMore();
    });

    expect(apiMocks.listUserEvents).toHaveBeenCalledTimes(2);
    expect(apiMocks.listUserEvents).toHaveBeenLastCalledWith(7, {
      tab: 'plans',
      sort: 'recent',
      page: 2,
    });
    expect(result.current.isLoadingMore).toBe(true);

    await resolveRequest(nextRequest, page([3]));

    expect(result.current.events.map(item => item.id)).toEqual(['1', '2', '3']);
    expect(result.current.isLoadingMore).toBe(false);
    expect(result.current.hasMore).toBe(false);
  });

  it('clears the pagination spinner when the tab changes during loadMore', async () => {
    const initialRequest = deferred<Paginated<BackendEvent>>();
    const pageRequest = deferred<Paginated<BackendEvent>>();
    const reloadRequest = deferred<Paginated<BackendEvent>>();

    apiMocks.listUserEvents
      .mockReturnValueOnce(initialRequest.promise)
      .mockReturnValueOnce(pageRequest.promise)
      .mockReturnValueOnce(reloadRequest.promise);

    const { result, rerender } = renderHook(
      (props: HookProps) => useProfileEvents(props),
      { initialProps: defaultProps },
    );

    await resolveRequest(initialRequest, page([1], '/next'));

    act(() => result.current.loadMore());

    expect(result.current.isLoadingMore).toBe(true);

    rerender({ ...defaultProps, tab: 'archive' });

    expect(result.current.isLoadingMore).toBe(false);

    await resolveRequest(pageRequest, page([2], '/next'));
    await resolveRequest(reloadRequest, page([3]));

    expect(result.current.events.map(item => item.id)).toEqual(['3']);
    expect(result.current.isLoadingMore).toBe(false);
  });

  it('holds pagination back until a re-enabled profile reloads page one', async () => {
    const firstRequest = deferred<Paginated<BackendEvent>>();
    const reloadRequest = deferred<Paginated<BackendEvent>>();
    const nextRequest = deferred<Paginated<BackendEvent>>();

    apiMocks.listUserEvents
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(reloadRequest.promise)
      .mockReturnValueOnce(nextRequest.promise);

    const { result, rerender } = renderHook(
      (props: HookProps) => useProfileEvents(props),
      { initialProps: defaultProps },
    );

    await resolveRequest(firstRequest, page([1], '/next'));

    rerender({ ...defaultProps, enabled: false });
    rerender({ ...defaultProps, enabled: true });

    act(() => result.current.loadMore());

    expect(apiMocks.listUserEvents).toHaveBeenCalledTimes(2);

    await resolveRequest(reloadRequest, page([2], '/next'));

    act(() => result.current.loadMore());

    expect(apiMocks.listUserEvents).toHaveBeenNthCalledWith(3, 7, {
      tab: 'plans',
      sort: 'recent',
      page: 2,
    });

    await resolveRequest(nextRequest, page([3]));

    expect(result.current.events.map(item => item.id)).toEqual(['2', '3']);
  });

  it('allows page two to be retried after a pagination failure', async () => {
    apiMocks.listUserEvents
      .mockResolvedValueOnce(page([1], '/next'))
      .mockRejectedValueOnce(new Error('page failed'))
      .mockResolvedValueOnce(page([2]));

    const { result } = renderHook(() => useProfileEvents(defaultProps));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.isLoadingMore).toBe(false));

    expect(result.current.events.map(item => item.id)).toEqual(['1']);
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.hasMore).toBe(false));

    expect(apiMocks.listUserEvents).toHaveBeenNthCalledWith(2, 7, {
      tab: 'plans',
      sort: 'recent',
      page: 2,
    });
    expect(apiMocks.listUserEvents).toHaveBeenNthCalledWith(3, 7, {
      tab: 'plans',
      sort: 'recent',
      page: 2,
    });
    expect(result.current.events.map(item => item.id)).toEqual(['1', '2']);
  });

  it.each([
    ['a missing user', { ...defaultProps, userId: null }],
    ['a disabled profile', { ...defaultProps, enabled: false }],
  ] as const)('stays idle for %s', (_label, props) => {
    const { result } = renderHook(() => useProfileEvents(props));

    expect(apiMocks.listUserEvents).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({
      events: [],
      isLoading: false,
      isLoadingMore: false,
      hasMore: false,
      error: null,
    });
  });

  it('hides data while disabled and starts a fresh load when enabled again', async () => {
    const firstRequest = deferred<Paginated<BackendEvent>>();
    const secondRequest = deferred<Paginated<BackendEvent>>();

    apiMocks.listUserEvents
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);

    const { result, rerender } = renderHook(
      (props: HookProps) => useProfileEvents(props),
      { initialProps: defaultProps },
    );

    await resolveRequest(firstRequest, page([1], '/next'));

    rerender({ ...defaultProps, enabled: false });

    expect(result.current.events).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasMore).toBe(false);
    expect(apiMocks.listUserEvents).toHaveBeenCalledTimes(1);

    rerender({ ...defaultProps, enabled: true });

    expect(apiMocks.listUserEvents).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toBe(true);

    await resolveRequest(secondRequest, page([2]));

    expect(result.current.events.map(item => item.id)).toEqual(['2']);
  });

  it('does not process a pending response after unmount', async () => {
    const request = deferred<Paginated<BackendEvent>>();

    apiMocks.listUserEvents.mockReturnValueOnce(request.promise);

    const { unmount } = renderHook(() => useProfileEvents(defaultProps));

    unmount();
    await resolveRequest(request, page([1]));

    expect(mapperMocks.toFeedEvents).not.toHaveBeenCalled();
  });
});
