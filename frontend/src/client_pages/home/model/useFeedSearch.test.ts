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

  const applyUpdate = () => {
    expect(updateQuery).toHaveBeenCalledOnce();
    const [mutate] = updateQuery.mock.calls[0] as [QueryMutation];
    const next = new URLSearchParams(searchParams);

    mutate(next);

    return next;
  };

  it('reads the title and commits it through the feed query router', async () => {
    searchParams = new URLSearchParams({
      filter: 'friends',
      event: '42',
      title: 'old title',
    });
    const { result } = renderHook(() => useFeedSearch());

    expect(result.current.value).toBe('old title');

    act(() => result.current.onChange('  birthday cake  '));
    await act(() => vi.advanceTimersByTimeAsync(500));

    expect(applyUpdate().toString()).toBe(
      'filter=friends&event=42&title=birthday+cake',
    );
  });

  it('removes only the title parameter for a blank search', () => {
    searchParams = new URLSearchParams({
      filter: 'plans',
      title: 'old title',
    });
    const { result } = renderHook(() => useFeedSearch());

    act(() => result.current.onSearch('   '));

    expect(applyUpdate().toString()).toBe('filter=plans');
  });
});
