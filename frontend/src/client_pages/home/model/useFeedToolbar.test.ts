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

import { useFeedToolbar } from './useFeedToolbar';

type QueryMutation = (params: URLSearchParams) => void;

describe('useFeedToolbar', () => {
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

  const applyUpdate = (base = searchParams) => {
    expect(updateQuery).toHaveBeenCalledOnce();

    const [mutate, mode] = updateQuery.mock.calls[0] as [
      QueryMutation,
      string | undefined,
    ];
    const next = new URLSearchParams(base);

    mutate(next);

    return { next, mode };
  };

  describe('reading the URL', () => {
    it('falls back to the defaults when nothing is in the URL', () => {
      const { result } = renderHook(() => useFeedToolbar());

      expect(result.current).toMatchObject({
        filter: 'all',
        reach: 'all',
        sort: 'recent',
      });
    });

    it('reads every supported value from the URL', () => {
      searchParams = new URLSearchParams({
        filter: 'wishes',
        reach: 'direct',
        sort: 'soonest',
      });

      const { result } = renderHook(() => useFeedToolbar());

      expect(result.current).toMatchObject({
        filter: 'wishes',
        reach: 'direct',
        sort: 'soonest',
      });
    });

    it.each([
      ['filter', 'plans'],
      ['reach', 'direct'],
      ['sort', 'soonest'],
    ])('accepts %s=%s', (param, value) => {
      searchParams = new URLSearchParams({ [param]: value });

      const { result } = renderHook(() => useFeedToolbar());

      expect(result.current[param as 'filter' | 'reach' | 'sort']).toBe(value);
    });

    it.each([
      ['filter', 'nonsense', 'all'],
      ['filter', '', 'all'],
      ['filter', 'PLANS', 'all'],
      ['reach', 'friends', 'all'],
      ['reach', 'DIRECT', 'all'],
      ['sort', 'popular', 'recent'],
      ['sort', '', 'recent'],
      ['sort', 'Recent', 'recent'],
    ])(
      'ignores the unsupported value %s=%s and uses %s',
      (param, value, expected) => {
        searchParams = new URLSearchParams({ [param]: value });

        const { result } = renderHook(() => useFeedToolbar());

        expect(result.current[param as 'filter' | 'reach' | 'sort']).toBe(
          expected,
        );
      },
    );

    it('downgrades sort=heat to recent while the filter is "all"', () => {
      searchParams = new URLSearchParams({ filter: 'all', sort: 'heat' });

      const { result } = renderHook(() => useFeedToolbar());

      expect(result.current.sort).toBe('recent');
    });

    it('keeps sort=heat for a narrowed filter', () => {
      searchParams = new URLSearchParams({ filter: 'plans', sort: 'heat' });

      const { result } = renderHook(() => useFeedToolbar());

      expect(result.current.sort).toBe('heat');
    });

    it('follows a URL change coming from history navigation', () => {
      searchParams = new URLSearchParams({ filter: 'plans' });

      const { result, rerender } = renderHook(() => useFeedToolbar());

      expect(result.current.filter).toBe('plans');

      searchParams = new URLSearchParams({ filter: 'wishes', reach: 'direct' });
      rerender();

      expect(result.current).toMatchObject({
        filter: 'wishes',
        reach: 'direct',
      });
    });
  });

  describe('writing to the URL', () => {
    it('pushes a history entry instead of replacing one', () => {
      const { result } = renderHook(() => useFeedToolbar());

      act(() => result.current.setFilter('plans'));

      expect(applyUpdate().mode).toBe('push');
    });

    it('writes a non-default filter', () => {
      const { result } = renderHook(() => useFeedToolbar());

      act(() => result.current.setFilter('wishes'));

      expect(applyUpdate().next.toString()).toBe('filter=wishes');
    });

    it('drops a parameter that falls back to its default', () => {
      searchParams = new URLSearchParams({
        filter: 'plans',
        reach: 'direct',
        sort: 'soonest',
      });

      const { result } = renderHook(() => useFeedToolbar());

      act(() => result.current.setReach('all'));

      expect(applyUpdate().next.toString()).toBe('filter=plans&sort=soonest');
    });

    it('keeps unrelated query parameters untouched', () => {
      searchParams = new URLSearchParams({
        title: 'birthday cake',
        event: '42',
      });

      const { result } = renderHook(() => useFeedToolbar());

      act(() => result.current.setSort('soonest'));

      expect(applyUpdate().next.toString()).toBe(
        'title=birthday+cake&event=42&sort=soonest',
      );
    });

    it('drops sort=heat when the filter widens back to "all"', () => {
      searchParams = new URLSearchParams({ filter: 'plans', sort: 'heat' });

      const { result } = renderHook(() => useFeedToolbar());

      act(() => result.current.setFilter('all'));

      expect(applyUpdate().next.toString()).toBe('');
    });

    it('keeps sort=heat when switching between narrowed filters', () => {
      searchParams = new URLSearchParams({ filter: 'plans', sort: 'heat' });

      const { result } = renderHook(() => useFeedToolbar());

      act(() => result.current.setFilter('wishes'));

      expect(applyUpdate().next.toString()).toBe('filter=wishes&sort=heat');
    });

    it('refuses sort=heat while the filter is "all"', () => {
      const { result } = renderHook(() => useFeedToolbar());

      act(() => result.current.setSort('heat'));

      expect(applyUpdate().next.toString()).toBe('');
    });

    it('sanitises a corrupt URL as a side effect of any change', () => {
      searchParams = new URLSearchParams({
        filter: 'nonsense',
        reach: 'friends',
        sort: 'popular',
      });

      const { result } = renderHook(() => useFeedToolbar());

      act(() => result.current.setReach('direct'));

      expect(applyUpdate().next.toString()).toBe('reach=direct');
    });

    it('patches only the requested control and preserves the rest', () => {
      searchParams = new URLSearchParams({
        filter: 'plans',
        reach: 'direct',
        sort: 'heat',
      });

      const { result } = renderHook(() => useFeedToolbar());

      act(() => result.current.setSort('soonest'));

      const { next } = applyUpdate();

      expect(next.get('filter')).toBe('plans');
      expect(next.get('reach')).toBe('direct');
      expect(next.get('sort')).toBe('soonest');
    });

    it('reads the live params passed to the mutation, not the render-time ones', () => {
      const { result } = renderHook(() => useFeedToolbar());

      act(() => result.current.setReach('direct'));
      const { next } = applyUpdate(new URLSearchParams({ filter: 'wishes' }));

      expect(next.toString()).toBe('filter=wishes&reach=direct');
    });

    it('keeps setter identities stable across re-renders', () => {
      const { result, rerender } = renderHook(() => useFeedToolbar());

      const first = result.current;

      rerender();

      expect(result.current.setFilter).toBe(first.setFilter);
      expect(result.current.setReach).toBe(first.setReach);
      expect(result.current.setSort).toBe(first.setSort);
    });
  });
});
