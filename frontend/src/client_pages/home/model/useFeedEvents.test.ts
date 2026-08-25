// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BackendEvent, Paginated } from '@/shared/client_api/event';
import { useEventsRefreshStore } from '@/shared/store/useEventsRefreshStore';
import type { FeedFilter, FeedReach, SortOption } from './types';

const apiMocks = vi.hoisted(() => ({
  listEvents: vi.fn(),
}));

const navigationMocks = vi.hoisted(() => ({
  useSearchParams: vi.fn(),
}));

const toolbarMocks = vi.hoisted(() => ({
  useFeedToolbar: vi.fn(),
}));

const mapperMocks = vi.hoisted(() => ({
  toFeedEvents: vi.fn(),
}));

vi.mock('@/shared/client_api/event', () => ({
  listEvents: apiMocks.listEvents,
}));

vi.mock('next/navigation', () => ({
  useSearchParams: navigationMocks.useSearchParams,
}));

vi.mock('./useFeedToolbar', () => ({
  useFeedToolbar: toolbarMocks.useFeedToolbar,
}));

vi.mock('./feedMapper', async importOriginal => {
  const actual = await importOriginal<typeof import('./feedMapper')>();

  mapperMocks.toFeedEvents.mockImplementation(actual.toFeedEvents);

  return { ...actual, toFeedEvents: mapperMocks.toFeedEvents };
});

import { useFeedEvents } from './useFeedEvents';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

type ToolbarState = {
  filter: FeedFilter;
  reach: FeedReach;
  sort: SortOption;
};

const deferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
};

const event = (id: number): BackendEvent => ({
  id,
  creator: `user-${id}`,
  creator_avatar: null,
  mutual_friend: null,
  category: null,
  event_type: 'wish',
  event_visibility: 'public',
  status: 'active',
  title: `Event ${id}`,
  description: `Description ${id}`,
  cover_image: null,
  location: `Location ${id}`,
  external_link: null,
  event_date: null,
  event_time: null,
  timeframe_text: 'Someday',
  min_participants: 1,
  max_participants: null,
  participants_count: 0,
  interested_count: id,
  participants_preview: [],
  created_at: `2026-08-${String(id).padStart(2, '0')}T00:00:00Z`,
  is_full: false,
  available_spots: null,
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

describe('useFeedEvents', () => {
  let searchParams: URLSearchParams;
  let toolbar: ToolbarState;

  beforeEach(() => {
    apiMocks.listEvents.mockReset();
    navigationMocks.useSearchParams.mockReset();
    toolbarMocks.useFeedToolbar.mockReset();
    mapperMocks.toFeedEvents.mockClear();
    useEventsRefreshStore.setState({
      refreshToken: 0,
      isDeferred: false,
      isPending: false,
      revealEventId: null,
    });

    searchParams = new URLSearchParams();
    toolbar = { filter: 'all', reach: 'all', sort: 'recent' };

    navigationMocks.useSearchParams.mockImplementation(() => searchParams);
    toolbarMocks.useFeedToolbar.mockImplementation(() => toolbar);
  });

  afterEach(cleanup);

  it('loads and maps the first page with the active query', async () => {
    const request = deferred<Paginated<BackendEvent>>();

    toolbar = { filter: 'wishes', reach: 'direct', sort: 'heat' };
    searchParams = new URLSearchParams({ title: 'birthday cake' });
    apiMocks.listEvents.mockReturnValueOnce(request.promise);

    const { result } = renderHook(() => useFeedEvents());

    expect(result.current).toMatchObject({
      events: [],
      isLoading: true,
      isLoadingMore: false,
      hasMore: false,
      error: null,
    });
    expect(apiMocks.listEvents).toHaveBeenCalledWith({
      type: 'wish',
      visible: 'friends',
      sort: 'heat',
      title: 'birthday cake',
      page: 1,
    });

    await resolveRequest(request, page([1, 2], '/api/event/events?page=2'));

    expect(result.current.events.map(item => item.id)).toEqual(['1', '2']);
    expect(result.current.events[0].title).toBe('Event 1');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('reloads for filter and search changes and ignores the older response', async () => {
    const oldRequest = deferred<Paginated<BackendEvent>>();
    const newRequest = deferred<Paginated<BackendEvent>>();

    apiMocks.listEvents
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(newRequest.promise);

    const { result, rerender } = renderHook(() => useFeedEvents());

    toolbar = { filter: 'plans', reach: 'direct', sort: 'soonest' };
    searchParams = new URLSearchParams({ title: 'concert' });
    rerender();

    expect(result.current.isLoading).toBe(true);
    expect(apiMocks.listEvents).toHaveBeenNthCalledWith(2, {
      type: 'plan',
      visible: 'friends',
      sort: 'soonest',
      title: 'concert',
      page: 1,
    });

    await resolveRequest(newRequest, page([2]));

    expect(result.current.events.map(item => item.id)).toEqual(['2']);
    expect(result.current.isLoading).toBe(false);

    await resolveRequest(oldRequest, page([1], '/old-next-page'));

    expect(result.current.events.map(item => item.id)).toEqual(['2']);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('reloads the first page when the refresh store changes', async () => {
    const initialRequest = deferred<Paginated<BackendEvent>>();
    const refreshRequest = deferred<Paginated<BackendEvent>>();

    apiMocks.listEvents
      .mockReturnValueOnce(initialRequest.promise)
      .mockReturnValueOnce(refreshRequest.promise);

    const { result } = renderHook(() => useFeedEvents());

    await resolveRequest(initialRequest, page([1], '/next'));

    act(() => useEventsRefreshStore.getState().requestRefresh());

    expect(apiMocks.listEvents).toHaveBeenCalledTimes(2);
    expect(apiMocks.listEvents).toHaveBeenLastCalledWith({
      sort: 'recent',
      page: 1,
    });

    await resolveRequest(refreshRequest, page([3]));

    expect(result.current.events.map(item => item.id)).toEqual(['3']);
    expect(result.current.hasMore).toBe(false);
  });

  it('clears old data and reports an initial-page failure', async () => {
    apiMocks.listEvents.mockRejectedValueOnce(new Error('network error'));

    const { result } = renderHook(() => useFeedEvents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.events).toEqual([]);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.error).toBe('Failed to load events');
  });

  it('refetches the first page on retry and clears the error', async () => {
    apiMocks.listEvents.mockRejectedValueOnce(new Error('network error'));

    const { result } = renderHook(() => useFeedEvents());

    await waitFor(() =>
      expect(result.current.error).toBe('Failed to load events'),
    );

    const retryRequest = deferred<Paginated<BackendEvent>>();

    apiMocks.listEvents.mockReturnValueOnce(retryRequest.promise);

    act(() => result.current.retry());

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(apiMocks.listEvents).toHaveBeenLastCalledWith({
      sort: 'recent',
      page: 1,
    });

    await resolveRequest(retryRequest, page([1, 2], '/next'));

    expect(result.current.events.map(item => item.id)).toEqual(['1', '2']);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('reports the error again when a retry also fails', async () => {
    apiMocks.listEvents
      .mockRejectedValueOnce(new Error('network error'))
      .mockRejectedValueOnce(new Error('still broken'));

    const { result } = renderHook(() => useFeedEvents());

    await waitFor(() =>
      expect(result.current.error).toBe('Failed to load events'),
    );

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('Failed to load events');
    expect(result.current.events).toEqual([]);
    expect(apiMocks.listEvents).toHaveBeenCalledTimes(2);
  });

  it('appends pages and blocks duplicate loadMore requests', async () => {
    const initialRequest = deferred<Paginated<BackendEvent>>();
    const nextRequest = deferred<Paginated<BackendEvent>>();

    apiMocks.listEvents
      .mockReturnValueOnce(initialRequest.promise)
      .mockReturnValueOnce(nextRequest.promise);

    const { result } = renderHook(() => useFeedEvents());

    await resolveRequest(initialRequest, page([1, 2], '/next'));

    act(() => {
      result.current.loadMore();
      result.current.loadMore();
    });

    expect(apiMocks.listEvents).toHaveBeenCalledTimes(2);
    expect(apiMocks.listEvents).toHaveBeenLastCalledWith({
      sort: 'recent',
      page: 2,
    });
    expect(result.current.isLoadingMore).toBe(true);

    await resolveRequest(nextRequest, page([3, 4]));

    expect(result.current.events.map(item => item.id)).toEqual([
      '1',
      '2',
      '3',
      '4',
    ]);
    expect(result.current.isLoadingMore).toBe(false);
    expect(result.current.hasMore).toBe(false);

    act(() => result.current.loadMore());

    expect(apiMocks.listEvents).toHaveBeenCalledTimes(2);
  });

  it('clears the pagination spinner when a selection change interrupts loadMore', async () => {
    const initialRequest = deferred<Paginated<BackendEvent>>();
    const pageRequest = deferred<Paginated<BackendEvent>>();
    const reloadRequest = deferred<Paginated<BackendEvent>>();

    apiMocks.listEvents
      .mockReturnValueOnce(initialRequest.promise)
      .mockReturnValueOnce(pageRequest.promise)
      .mockReturnValueOnce(reloadRequest.promise);

    const { result, rerender } = renderHook(() => useFeedEvents());

    await resolveRequest(initialRequest, page([1], '/next'));

    act(() => result.current.loadMore());

    expect(result.current.isLoadingMore).toBe(true);

    toolbar = { filter: 'wishes', reach: 'all', sort: 'recent' };
    rerender();

    expect(result.current.isLoadingMore).toBe(false);

    await resolveRequest(pageRequest, page([2], '/next'));
    await resolveRequest(reloadRequest, page([3]));

    expect(result.current.events.map(item => item.id)).toEqual(['3']);
    expect(result.current.isLoadingMore).toBe(false);
  });

  it('holds pagination back while a refresh reloads the first page', async () => {
    const initialRequest = deferred<Paginated<BackendEvent>>();
    const refreshRequest = deferred<Paginated<BackendEvent>>();
    const nextRequest = deferred<Paginated<BackendEvent>>();

    apiMocks.listEvents
      .mockReturnValueOnce(initialRequest.promise)
      .mockReturnValueOnce(refreshRequest.promise)
      .mockReturnValueOnce(nextRequest.promise);

    const { result } = renderHook(() => useFeedEvents());

    await resolveRequest(initialRequest, page([1], '/next'));

    act(() => useEventsRefreshStore.getState().requestRefresh());
    act(() => result.current.loadMore());

    expect(apiMocks.listEvents).toHaveBeenCalledTimes(2);
    expect(result.current.isLoadingMore).toBe(false);

    await resolveRequest(refreshRequest, page([2], '/next'));

    act(() => result.current.loadMore());

    expect(apiMocks.listEvents).toHaveBeenNthCalledWith(3, {
      sort: 'recent',
      page: 2,
    });

    await resolveRequest(nextRequest, page([3]));

    expect(result.current.events.map(item => item.id)).toEqual(['2', '3']);
  });

  it('keeps the current page and allows a retry after loadMore fails', async () => {
    apiMocks.listEvents
      .mockResolvedValueOnce(page([1], '/next'))
      .mockRejectedValueOnce(new Error('page failed'))
      .mockResolvedValueOnce(page([2]));

    const { result } = renderHook(() => useFeedEvents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.isLoadingMore).toBe(false));

    expect(result.current.events.map(item => item.id)).toEqual(['1']);
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.hasMore).toBe(false));

    expect(apiMocks.listEvents).toHaveBeenNthCalledWith(2, {
      sort: 'recent',
      page: 2,
    });
    expect(apiMocks.listEvents).toHaveBeenNthCalledWith(3, {
      sort: 'recent',
      page: 2,
    });
    expect(result.current.events.map(item => item.id)).toEqual(['1', '2']);
  });

  it('does not process a pending response after unmount', async () => {
    const request = deferred<Paginated<BackendEvent>>();

    apiMocks.listEvents.mockReturnValueOnce(request.promise);

    const { unmount } = renderHook(() => useFeedEvents());

    unmount();
    await resolveRequest(request, page([1]));

    expect(mapperMocks.toFeedEvents).not.toHaveBeenCalled();
  });
});
