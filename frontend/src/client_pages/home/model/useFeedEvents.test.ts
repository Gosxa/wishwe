// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BackendEvent, Paginated } from '@/shared/client_api/event';
import { useEventsRefreshStore } from '@/shared/store/useEventsRefreshStore';
import type { FeedFilter, FeedReach, SortOption } from './types';

const apiMocks = vi.hoisted(() => ({ listEvents: vi.fn() }));
const navigationMocks = vi.hoisted(() => ({ useSearchParams: vi.fn() }));
const toolbarMocks = vi.hoisted(() => ({ useFeedToolbar: vi.fn() }));

vi.mock('@/shared/client_api/event', () => ({
  listEvents: apiMocks.listEvents,
}));
vi.mock('next/navigation', () => ({
  useSearchParams: navigationMocks.useSearchParams,
}));
vi.mock('./useFeedToolbar', () => ({
  useFeedToolbar: toolbarMocks.useFeedToolbar,
}));

import { useFeedEvents } from './useFeedEvents';

type ToolbarState = {
  filter: FeedFilter;
  reach: FeedReach;
  sort: SortOption;
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

describe('useFeedEvents', () => {
  let searchParams: URLSearchParams;
  let toolbar: ToolbarState;

  beforeEach(() => {
    apiMocks.listEvents.mockReset();
    searchParams = new URLSearchParams();
    toolbar = { filter: 'all', reach: 'all', sort: 'recent' };
    navigationMocks.useSearchParams.mockImplementation(() => searchParams);
    toolbarMocks.useFeedToolbar.mockImplementation(() => toolbar);
    useEventsRefreshStore.setState({
      refreshToken: 0,
      isDeferred: false,
      isPending: false,
      revealEventId: null,
    });
  });

  afterEach(cleanup);

  it('loads and maps a page with the active feed query', async () => {
    toolbar = { filter: 'wishes', reach: 'direct', sort: 'heat' };
    searchParams = new URLSearchParams({ title: 'birthday cake' });
    apiMocks.listEvents.mockResolvedValueOnce(page([1, 2], '/next'));

    const { result } = renderHook(() => useFeedEvents());

    expect(apiMocks.listEvents).toHaveBeenCalledWith({
      type: 'wish',
      visible: 'friends',
      sort: 'heat',
      title: 'birthday cake',
      page: 1,
    });

    await act(async () => apiMocks.listEvents.mock.results[0].value);

    expect(result.current.events.map(item => item.id)).toEqual(['1', '2']);
    expect(result.current.events[0].title).toBe('Event 1');
    expect(result.current.hasMore).toBe(true);
  });

  it('rebuilds the request when the feed selection changes', async () => {
    apiMocks.listEvents.mockResolvedValue(page([]));
    const { rerender } = renderHook(() => useFeedEvents());

    toolbar = { filter: 'plans', reach: 'direct', sort: 'soonest' };
    searchParams = new URLSearchParams({ title: 'concert' });
    rerender();

    expect(apiMocks.listEvents).toHaveBeenNthCalledWith(2, {
      type: 'plan',
      visible: 'friends',
      sort: 'soonest',
      title: 'concert',
      page: 1,
    });
  });

  it('refreshes in the background without showing a new initial loader', async () => {
    let resolveRefresh!: (value: Paginated<BackendEvent>) => void;
    const refreshRequest = new Promise<Paginated<BackendEvent>>(resolve => {
      resolveRefresh = resolve;
    });

    apiMocks.listEvents
      .mockResolvedValueOnce(page([1], '/next'))
      .mockReturnValueOnce(refreshRequest);
    const { result } = renderHook(() => useFeedEvents());

    await act(async () => apiMocks.listEvents.mock.results[0].value);
    act(() => useEventsRefreshStore.getState().requestRefresh());

    expect(apiMocks.listEvents).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      resolveRefresh(page([2]));
      await refreshRequest;
    });

    expect(result.current.events.map(item => item.id)).toEqual(['2']);
  });
});
