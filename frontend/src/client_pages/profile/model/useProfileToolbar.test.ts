// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import { useProfileToolbar } from './useProfileToolbar';

type QueryMutation = (params: URLSearchParams) => void;

describe('useProfileToolbar', () => {
  const updateQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    navigationMocks.useSearchParams.mockReturnValue(new URLSearchParams());
    querySyncMocks.useQuerySync.mockReturnValue(updateQuery);
  });

  const getPendingUpdate = () => {
    expect(updateQuery).toHaveBeenCalledOnce();

    const [mutate, mode] = updateQuery.mock.calls[0] as [QueryMutation, string];

    return { mutate, mode };
  };

  it.each([
    ['plans', 'recent'],
    ['wishes', 'soonest'],
    ['archive', 'recent'],
  ] as const)('reads filter=%s and sort=%s from the URL', (tab, sort) => {
    navigationMocks.useSearchParams.mockReturnValue(
      new URLSearchParams({ filter: tab, sort }),
    );

    const { result } = renderHook(() => useProfileToolbar());

    expect(result.current.tab).toBe(tab);
    expect(result.current.sort).toBe(sort);
  });

  it('falls back to the default options for missing or invalid values', () => {
    navigationMocks.useSearchParams.mockReturnValue(
      new URLSearchParams({ filter: 'unknown', sort: 'heat' }),
    );

    const { result } = renderHook(() => useProfileToolbar());

    expect(result.current.tab).toBe('plans');
    expect(result.current.sort).toBe('recent');
  });

  it('pushes a filter change and preserves other query parameters', () => {
    const current = new URLSearchParams({
      title: 'birthday',
      event: 'event-123',
      sort: 'soonest',
    });

    navigationMocks.useSearchParams.mockReturnValue(current);

    const { result } = renderHook(() => useProfileToolbar());

    act(() => result.current.setTab('wishes'));

    const { mutate, mode } = getPendingUpdate();
    const next = new URLSearchParams(current);

    mutate(next);

    expect(mode).toBe('push');
    expect(next.get('filter')).toBe('wishes');
    expect(next.get('sort')).toBe('soonest');
    expect(next.get('title')).toBe('birthday');
    expect(next.get('event')).toBe('event-123');
  });

  it('removes the filter parameter when returning to the default tab', () => {
    const current = new URLSearchParams({
      filter: 'archive',
      sort: 'soonest',
      title: 'trip',
    });

    navigationMocks.useSearchParams.mockReturnValue(current);

    const { result } = renderHook(() => useProfileToolbar());

    act(() => result.current.setTab('plans'));

    const { mutate } = getPendingUpdate();
    const next = new URLSearchParams(current);

    mutate(next);

    expect(next.has('filter')).toBe(false);
    expect(next.get('sort')).toBe('soonest');
    expect(next.get('title')).toBe('trip');
  });

  it('pushes a non-default sort and preserves the selected filter', () => {
    const current = new URLSearchParams({
      filter: 'archive',
      event: 'event-456',
    });

    navigationMocks.useSearchParams.mockReturnValue(current);

    const { result } = renderHook(() => useProfileToolbar());

    act(() => result.current.setSort('soonest'));

    const { mutate, mode } = getPendingUpdate();
    const next = new URLSearchParams(current);

    mutate(next);

    expect(mode).toBe('push');
    expect(next.get('filter')).toBe('archive');
    expect(next.get('sort')).toBe('soonest');
    expect(next.get('event')).toBe('event-456');
  });

  it('pushes a sort change and removes the default sort from the URL', () => {
    const current = new URLSearchParams({
      filter: 'wishes',
      sort: 'soonest',
      event: 'event-456',
    });

    navigationMocks.useSearchParams.mockReturnValue(current);

    const { result } = renderHook(() => useProfileToolbar());

    act(() => result.current.setSort('recent'));

    const { mutate, mode } = getPendingUpdate();
    const next = new URLSearchParams(current);

    mutate(next);

    expect(mode).toBe('push');
    expect(next.get('filter')).toBe('wishes');
    expect(next.has('sort')).toBe(false);
    expect(next.get('event')).toBe('event-456');
  });
});
