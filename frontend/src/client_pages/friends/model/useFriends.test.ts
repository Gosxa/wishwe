// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  FriendApi,
  FriendRequestApi,
} from '@/shared/client_api/user/types';
import type { Paginated } from '@/shared/client_api/event';

const apiMocks = vi.hoisted(() => ({
  acceptRequest: vi.fn(),
  declineRequest: vi.fn(),
  listFriends: vi.fn(),
  listIncomingRequests: vi.fn(),
  removeFriend: vi.fn(),
}));

vi.mock('@/shared/client_api/user', () => ({
  acceptRequest: apiMocks.acceptRequest,
  declineRequest: apiMocks.declineRequest,
  listFriends: apiMocks.listFriends,
  listIncomingRequests: apiMocks.listIncomingRequests,
  removeFriend: apiMocks.removeFriend,
}));

import { useFriends } from './useFriends';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
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

const friend = (id: number, username = `friend-${id}`): FriendApi => ({
  id,
  username,
  avatar: null,
  friendship_id: id + 100,
});

const request = (id: number, sender = `sender-${id}`): FriendRequestApi => ({
  id,
  sender,
  sender_avatar: null,
  receiver: 'current-user',
  status: 'pending',
});

const page = (
  results: FriendApi[],
  next: string | null = null,
): Paginated<FriendApi> => ({
  count: results.length,
  next,
  previous: null,
  results,
});

const settleInitialLoad = async (result: {
  current: ReturnType<typeof useFriends>;
}) => {
  await waitFor(() => expect(result.current.isLoading).toBe(false));
};

describe('useFriends', () => {
  beforeEach(() => {
    apiMocks.acceptRequest.mockReset();
    apiMocks.declineRequest.mockReset();
    apiMocks.listFriends.mockReset();
    apiMocks.listIncomingRequests.mockReset();
    apiMocks.removeFriend.mockReset();

    apiMocks.acceptRequest.mockResolvedValue(undefined);
    apiMocks.declineRequest.mockResolvedValue(undefined);
    apiMocks.listFriends.mockResolvedValue(page([]));
    apiMocks.listIncomingRequests.mockResolvedValue([]);
    apiMocks.removeFriend.mockResolvedValue(undefined);
  });

  afterEach(cleanup);

  it('loads and maps every friends page together with incoming requests', async () => {
    apiMocks.listFriends
      .mockResolvedValueOnce(page([friend(1)], '/friends?page=2'))
      .mockResolvedValueOnce(page([friend(2, 'second')], null));
    apiMocks.listIncomingRequests.mockResolvedValueOnce([
      request(7, 'requester'),
    ]);

    const { result } = renderHook(() => useFriends());

    expect(result.current).toMatchObject({
      friends: [],
      requests: [],
      isLoading: true,
      error: null,
    });

    await settleInitialLoad(result);

    expect(apiMocks.listFriends.mock.calls).toEqual([[1], [2]]);
    expect(result.current.friends).toEqual([
      {
        id: 1,
        username: 'friend-1',
        avatar: null,
        friendshipId: 101,
      },
      {
        id: 2,
        username: 'second',
        avatar: null,
        friendshipId: 102,
      },
    ]);
    expect(result.current.requests).toEqual([
      { id: 7, username: 'requester', avatar: null },
    ]);
    expect(result.current.error).toBeNull();
  });

  it('reports a loading failure without exposing partial data', async () => {
    apiMocks.listFriends.mockRejectedValueOnce(new Error('network error'));

    const { result } = renderHook(() => useFriends());

    await settleInitialLoad(result);

    expect(result.current.friends).toEqual([]);
    expect(result.current.requests).toEqual([]);
    expect(result.current.error).toBe('Failed to load friends');
  });

  it('removes a friend optimistically and keeps the removal on success', async () => {
    const removal = deferred<void>();

    apiMocks.listFriends.mockResolvedValueOnce(page([friend(1), friend(2)]));
    apiMocks.removeFriend.mockReturnValueOnce(removal.promise);

    const { result } = renderHook(() => useFriends());

    await settleInitialLoad(result);

    let action!: Promise<void>;

    act(() => {
      action = result.current.removeFriend(101);
    });

    expect(apiMocks.removeFriend).toHaveBeenCalledWith(101);
    expect(result.current.friends.map(item => item.id)).toEqual([2]);

    await act(async () => {
      removal.resolve();
      await action;
    });

    expect(result.current.friends.map(item => item.id)).toEqual([2]);
  });

  it('restores the friend snapshot when an optimistic removal fails', async () => {
    const removal = deferred<void>();

    apiMocks.listFriends.mockResolvedValueOnce(page([friend(1), friend(2)]));
    apiMocks.removeFriend.mockReturnValueOnce(removal.promise);

    const { result } = renderHook(() => useFriends());

    await settleInitialLoad(result);

    let action!: Promise<void>;

    act(() => {
      action = result.current.removeFriend(101);
    });

    expect(result.current.friends.map(item => item.id)).toEqual([2]);

    await act(async () => {
      removal.reject(new Error('remove failed'));
      await action;
    });

    expect(result.current.friends.map(item => item.id)).toEqual([1, 2]);
  });

  it('optimistically accepts a request and reloads every friends page', async () => {
    const acceptance = deferred<void>();

    apiMocks.listFriends
      .mockResolvedValueOnce(page([friend(1)]))
      .mockResolvedValueOnce(page([friend(1)], '/friends?page=2'))
      .mockResolvedValueOnce(page([friend(3)]));
    apiMocks.listIncomingRequests.mockResolvedValueOnce([
      request(7),
      request(8),
    ]);
    apiMocks.acceptRequest.mockReturnValueOnce(acceptance.promise);

    const { result } = renderHook(() => useFriends());

    await settleInitialLoad(result);

    let action!: Promise<void>;

    act(() => {
      action = result.current.acceptRequest(7);
    });

    expect(apiMocks.acceptRequest).toHaveBeenCalledWith(7);
    expect(result.current.requests.map(item => item.id)).toEqual([8]);

    await act(async () => {
      acceptance.resolve();
      await action;
    });

    expect(apiMocks.listFriends.mock.calls).toEqual([[1], [1], [2]]);
    expect(result.current.friends.map(item => item.id)).toEqual([1, 3]);
    expect(result.current.requests.map(item => item.id)).toEqual([8]);
  });

  it('rolls an accepted request back when the request fails', async () => {
    const acceptance = deferred<void>();

    apiMocks.listIncomingRequests.mockResolvedValueOnce([
      request(7),
      request(8),
    ]);
    apiMocks.acceptRequest.mockReturnValueOnce(acceptance.promise);

    const { result } = renderHook(() => useFriends());

    await settleInitialLoad(result);

    let action!: Promise<void>;

    act(() => {
      action = result.current.acceptRequest(7);
    });

    expect(result.current.requests.map(item => item.id)).toEqual([8]);

    await act(async () => {
      acceptance.reject(new Error('accept failed'));
      await action;
    });

    expect(result.current.requests.map(item => item.id)).toEqual([7, 8]);
    expect(apiMocks.listFriends).toHaveBeenCalledTimes(1);
  });

  it('optimistically declines a request and keeps the removal on success', async () => {
    const decline = deferred<void>();

    apiMocks.listIncomingRequests.mockResolvedValueOnce([
      request(7),
      request(8),
    ]);
    apiMocks.declineRequest.mockReturnValueOnce(decline.promise);

    const { result } = renderHook(() => useFriends());

    await settleInitialLoad(result);

    let action!: Promise<void>;

    act(() => {
      action = result.current.declineRequest(7);
    });

    expect(apiMocks.declineRequest).toHaveBeenCalledWith(7);
    expect(result.current.requests.map(item => item.id)).toEqual([8]);

    await act(async () => {
      decline.resolve();
      await action;
    });

    expect(result.current.requests.map(item => item.id)).toEqual([8]);
  });

  it('restores a declined request when the request fails', async () => {
    const decline = deferred<void>();

    apiMocks.listIncomingRequests.mockResolvedValueOnce([
      request(7),
      request(8),
    ]);
    apiMocks.declineRequest.mockReturnValueOnce(decline.promise);

    const { result } = renderHook(() => useFriends());

    await settleInitialLoad(result);

    let action!: Promise<void>;

    act(() => {
      action = result.current.declineRequest(7);
    });

    expect(result.current.requests.map(item => item.id)).toEqual([8]);

    await act(async () => {
      decline.reject(new Error('decline failed'));
      await action;
    });

    expect(result.current.requests.map(item => item.id)).toEqual([7, 8]);
  });
});
