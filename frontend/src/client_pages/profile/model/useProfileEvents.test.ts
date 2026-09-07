// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BackendEvent, Paginated } from '@/shared/client_api/event';
import { useEventsRefreshStore } from '@/shared/store/useEventsRefreshStore';
import type { ProfileSort, ProfileTab } from './types';

const apiMocks = vi.hoisted(() => ({ listUserEvents: vi.fn() }));
const navigationMocks = vi.hoisted(() => ({ useSearchParams: vi.fn() }));

vi.mock('@/shared/client_api/user', () => ({
  listUserEvents: apiMocks.listUserEvents,
}));
vi.mock('next/navigation', () => ({
  useSearchParams: navigationMocks.useSearchParams,
}));

import { useProfileEvents } from './useProfileEvents';

type HookProps = {
  userId: number | null;
  tab: ProfileTab;
  sort: ProfileSort;
  refreshKey?: number;
  enabled?: boolean;
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

const page = (ids: number[]): Paginated<BackendEvent> => ({
  count: ids.length,
  next: null,
  previous: null,
  results: ids.map(event),
});

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
    searchParams = new URLSearchParams();
    navigationMocks.useSearchParams.mockImplementation(() => searchParams);
    useEventsRefreshStore.setState({
      refreshToken: 0,
      isDeferred: false,
      isPending: false,
      revealEventId: null,
    });
  });

  afterEach(cleanup);

  it('loads and maps the selected profile page', async () => {
    searchParams = new URLSearchParams({ title: 'summer trip' });
    apiMocks.listUserEvents.mockResolvedValueOnce(page([1, 2]));
    const props = {
      userId: 42,
      tab: 'wishes',
      sort: 'soonest',
      refreshKey: 3,
      enabled: true,
    } as const;

    const { result } = renderHook(() => useProfileEvents(props));

    expect(apiMocks.listUserEvents).toHaveBeenCalledWith(42, {
      tab: 'wishes',
      sort: 'soonest',
      title: 'summer trip',
      page: 1,
    });

    await act(async () => apiMocks.listUserEvents.mock.results[0].value);

    expect(result.current.events.map(item => item.id)).toEqual(['1', '2']);
    expect(result.current.events[0].title).toBe('Profile event 1');
  });

  it('rebuilds the request for profile identity and options', () => {
    apiMocks.listUserEvents.mockResolvedValue(page([]));
    const { rerender } = renderHook(
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

    expect(apiMocks.listUserEvents).toHaveBeenNthCalledWith(2, 8, {
      tab: 'archive',
      sort: 'soonest',
      title: 'new title',
      page: 1,
    });
  });

  it('reloads for local and shared refresh keys', () => {
    apiMocks.listUserEvents.mockResolvedValue(page([]));
    const { rerender } = renderHook(
      (props: HookProps) => useProfileEvents(props),
      { initialProps: defaultProps },
    );

    rerender({ ...defaultProps, refreshKey: 1 });
    act(() => useEventsRefreshStore.getState().requestRefresh());

    expect(apiMocks.listUserEvents).toHaveBeenCalledTimes(3);
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

  it('hides profile data while disabled and reloads when enabled', async () => {
    apiMocks.listUserEvents
      .mockResolvedValueOnce(page([1]))
      .mockResolvedValueOnce(page([2]));
    const { result, rerender } = renderHook(
      (props: HookProps) => useProfileEvents(props),
      { initialProps: defaultProps },
    );

    await act(async () => apiMocks.listUserEvents.mock.results[0].value);

    rerender({ ...defaultProps, enabled: false });
    expect(result.current.events).toEqual([]);
    expect(apiMocks.listUserEvents).toHaveBeenCalledOnce();

    rerender({ ...defaultProps, enabled: true });
    await act(async () => apiMocks.listUserEvents.mock.results[1].value);

    expect(result.current.events.map(item => item.id)).toEqual(['2']);
    expect(apiMocks.listUserEvents).toHaveBeenCalledTimes(2);
  });
});
