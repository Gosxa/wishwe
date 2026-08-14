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

vi.mock('./useQuerySync', () => ({
  useQuerySync: querySyncMocks.useQuerySync,
}));

import { useEventDeepLink } from './useEventDeepLink';

type QueryMutation = (params: URLSearchParams) => void;

describe('useEventDeepLink', () => {
  const updateQuery = vi.fn();
  let searchParams: URLSearchParams;

  beforeEach(() => {
    searchParams = new URLSearchParams();
    navigationMocks.useSearchParams.mockImplementation(() => searchParams);
    querySyncMocks.useQuerySync.mockReturnValue(updateQuery);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it.each([
    {
      expectedId: null,
      isFeedLoading: false,
      loadedEvents: [],
      name: 'has no deep link without an event parameter',
      query: '',
      showDeepLinkCard: false,
    },
    {
      expectedId: '42',
      isFeedLoading: false,
      loadedEvents: [],
      name: 'shows a fallback card for an unloaded linked event',
      query: 'event=42',
      showDeepLinkCard: true,
    },
    {
      expectedId: '42',
      isFeedLoading: false,
      loadedEvents: [{ id: '42' }],
      name: 'uses a matching event already present in the feed',
      query: 'event=42',
      showDeepLinkCard: false,
    },
    {
      expectedId: '42',
      isFeedLoading: true,
      loadedEvents: [],
      name: 'waits for feed loading before showing a fallback card',
      query: 'event=42',
      showDeepLinkCard: false,
    },
  ])('$name', scenario => {
    searchParams = new URLSearchParams(scenario.query);

    const { result } = renderHook(() =>
      useEventDeepLink(scenario.loadedEvents, scenario.isFeedLoading),
    );

    expect(result.current.openEventId).toBe(scenario.expectedId);
    expect(result.current.showDeepLinkCard).toBe(scenario.showDeepLinkCard);
  });

  it('sets the event parameter while preserving the rest of the query', () => {
    searchParams = new URLSearchParams('filter=plans&title=party&event=old');
    const { result } = renderHook(() => useEventDeepLink([]));

    act(() => result.current.setEventParam('99'));

    expect(updateQuery).toHaveBeenCalledOnce();
    const [mutate] = updateQuery.mock.calls[0] as [QueryMutation];
    const next = new URLSearchParams(searchParams);

    mutate(next);

    expect(next.toString()).toBe('filter=plans&title=party&event=99');
  });

  it('clears only the event parameter', () => {
    searchParams = new URLSearchParams('filter=wishes&event=42&sort=recent');
    const { result } = renderHook(() => useEventDeepLink([]));

    act(() => result.current.clearEventParam());

    expect(updateQuery).toHaveBeenCalledOnce();
    const [mutate] = updateQuery.mock.calls[0] as [QueryMutation];
    const next = new URLSearchParams(searchParams);

    mutate(next);

    expect(next.toString()).toBe('filter=wishes&sort=recent');
  });

  it('follows event query changes from browser navigation', () => {
    searchParams = new URLSearchParams('event=first');
    const { result, rerender } = renderHook(() => useEventDeepLink([]));

    searchParams = new URLSearchParams('event=second');
    rerender();

    expect(result.current.openEventId).toBe('second');
    expect(result.current.showDeepLinkCard).toBe(true);
  });
});
