// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePaginatedList } from './usePaginatedList';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

type Props = {
  enabled?: boolean;
  requestKey: string;
  loadingKey?: string;
};

const deferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

const page = (results: number[], next: string | null = null) => ({
  results,
  next,
});

const resolveRequest = async <T>(request: Deferred<T>, value: T) => {
  await act(async () => {
    request.resolve(value);
    await request.promise;
  });
};

const mapItems = (items: number[]) => items.map(item => `item-${item}`);

const setup = (
  fetchPage: (pageNumber: number) => Promise<ReturnType<typeof page>>,
  initialProps: Props = { requestKey: 'first' },
) =>
  renderHook(
    ({ enabled = true, requestKey, loadingKey }: Props) =>
      usePaginatedList({
        enabled,
        requestKey,
        loadingKey,
        fetchPage,
        mapItems,
        errorMessage: 'Failed to load items',
      }),
    { initialProps },
  );

describe('usePaginatedList', () => {
  afterEach(cleanup);

  it('loads and maps the first page', async () => {
    const request = deferred<ReturnType<typeof page>>();
    const fetchPage = vi.fn().mockReturnValue(request.promise);
    const { result } = setup(fetchPage);

    expect(result.current).toMatchObject({
      items: [],
      isLoading: true,
      isLoadingMore: false,
      hasMore: false,
      error: null,
    });
    expect(fetchPage).toHaveBeenCalledWith(1);

    await resolveRequest(request, page([1, 2], '/next'));

    expect(result.current.items).toEqual(['item-1', 'item-2']);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasMore).toBe(true);
  });

  it('ignores an older response after the request key changes', async () => {
    const oldRequest = deferred<ReturnType<typeof page>>();
    const newRequest = deferred<ReturnType<typeof page>>();
    const fetchPage = vi
      .fn()
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(newRequest.promise);
    const { result, rerender } = setup(fetchPage);

    rerender({ requestKey: 'second' });
    await resolveRequest(newRequest, page([2]));
    await resolveRequest(oldRequest, page([1], '/old-next'));

    expect(result.current.items).toEqual(['item-2']);
    expect(result.current.hasMore).toBe(false);
  });

  it('reports an initial failure and retries page one', async () => {
    const fetchPage = vi
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce(page([1], '/next'));
    const { result } = setup(fetchPage);

    await waitFor(() =>
      expect(result.current.error).toBe('Failed to load items'),
    );

    act(() => result.current.retry());

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchPage).toHaveBeenNthCalledWith(2, 1);
    expect(result.current.items).toEqual(['item-1']);
    expect(result.current.hasMore).toBe(true);
  });

  it('appends pages and suppresses duplicate load-more requests', async () => {
    const firstRequest = deferred<ReturnType<typeof page>>();
    const nextRequest = deferred<ReturnType<typeof page>>();
    const fetchPage = vi
      .fn()
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(nextRequest.promise);
    const { result } = setup(fetchPage);

    await resolveRequest(firstRequest, page([1, 2], '/next'));

    act(() => {
      result.current.loadMore();
      result.current.loadMore();
    });

    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage).toHaveBeenLastCalledWith(2);
    expect(result.current.isLoadingMore).toBe(true);

    await resolveRequest(nextRequest, page([3]));

    expect(result.current.items).toEqual(['item-1', 'item-2', 'item-3']);
    expect(result.current.isLoadingMore).toBe(false);
    expect(result.current.hasMore).toBe(false);

    act(() => result.current.loadMore());
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it('clears interrupted pagination and ignores its stale response', async () => {
    const firstRequest = deferred<ReturnType<typeof page>>();
    const pageRequest = deferred<ReturnType<typeof page>>();
    const reloadRequest = deferred<ReturnType<typeof page>>();
    const fetchPage = vi
      .fn()
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(pageRequest.promise)
      .mockReturnValueOnce(reloadRequest.promise);
    const { result, rerender } = setup(fetchPage);

    await resolveRequest(firstRequest, page([1], '/next'));
    act(() => result.current.loadMore());

    rerender({ requestKey: 'second' });
    expect(result.current.isLoadingMore).toBe(false);

    await resolveRequest(pageRequest, page([2], '/next'));
    await resolveRequest(reloadRequest, page([3]));

    expect(result.current.items).toEqual(['item-3']);
    expect(result.current.isLoadingMore).toBe(false);
  });

  it('blocks pagination during a background reload with the same loading key', async () => {
    const firstRequest = deferred<ReturnType<typeof page>>();
    const reloadRequest = deferred<ReturnType<typeof page>>();
    const nextRequest = deferred<ReturnType<typeof page>>();
    const fetchPage = vi
      .fn()
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(reloadRequest.promise)
      .mockReturnValueOnce(nextRequest.promise);
    const { result, rerender } = setup(fetchPage, {
      requestKey: 'selection|0',
      loadingKey: 'selection',
    });

    await resolveRequest(firstRequest, page([1], '/next'));

    rerender({ requestKey: 'selection|1', loadingKey: 'selection' });

    expect(result.current.isLoading).toBe(false);
    act(() => result.current.loadMore());
    expect(fetchPage).toHaveBeenCalledTimes(2);

    await resolveRequest(reloadRequest, page([2], '/next'));
    act(() => result.current.loadMore());

    expect(fetchPage).toHaveBeenNthCalledWith(3, 2);
    await resolveRequest(nextRequest, page([3]));
    expect(result.current.items).toEqual(['item-2', 'item-3']);
  });

  it('allows the same next page to be retried after a failure', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(page([1], '/next'))
      .mockRejectedValueOnce(new Error('page failed'))
      .mockResolvedValueOnce(page([2]));
    const { result } = setup(fetchPage);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.isLoadingMore).toBe(false));

    expect(result.current.items).toEqual(['item-1']);
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.hasMore).toBe(false));

    expect(fetchPage).toHaveBeenNthCalledWith(2, 2);
    expect(fetchPage).toHaveBeenNthCalledWith(3, 2);
    expect(result.current.items).toEqual(['item-1', 'item-2']);
  });

  it('stays idle while disabled and starts fresh when re-enabled', async () => {
    const request = deferred<ReturnType<typeof page>>();
    const fetchPage = vi.fn().mockReturnValue(request.promise);
    const { result, rerender } = setup(fetchPage, {
      enabled: false,
      requestKey: 'first',
    });

    expect(result.current).toMatchObject({
      items: [],
      isLoading: false,
      isLoadingMore: false,
      hasMore: false,
      error: null,
    });

    rerender({ enabled: true, requestKey: 'first' });
    expect(fetchPage).toHaveBeenCalledOnce();
    expect(result.current.isLoading).toBe(true);

    await resolveRequest(request, page([1]));
    expect(result.current.items).toEqual(['item-1']);
  });

  it('does not map a pending response after unmount', async () => {
    const request = deferred<ReturnType<typeof page>>();
    const fetchPage = vi.fn().mockReturnValue(request.promise);
    const map = vi.fn(mapItems);
    const { unmount } = renderHook(() =>
      usePaginatedList({
        requestKey: 'first',
        fetchPage,
        mapItems: map,
        errorMessage: 'Failed to load items',
      }),
    );

    unmount();
    await resolveRequest(request, page([1]));

    expect(map).not.toHaveBeenCalled();
  });
});
