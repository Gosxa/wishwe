'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  acceptRequest as acceptRequestApi,
  declineRequest as declineRequestApi,
  listFriends,
  listIncomingRequests,
  removeFriend as removeFriendApi,
} from '@/shared/client_api/user';
import { toFriend, toFriendRequest } from './mappers';
import type { Friend, FriendRequest } from './types';

const MAX_PAGES = 100;

const loadAllFriends = async (): Promise<Friend[]> => {
  const all: Friend[] = [];
  let page = 1;

  for (let i = 0; i < MAX_PAGES; i++) {
    const data = await listFriends(page);

    all.push(...data.results.map(toFriend));

    if (!data.next) break;
    page += 1;
  }

  return all;
};

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([loadAllFriends(), listIncomingRequests()])
      .then(([friendsData, requestsData]) => {
        if (!active) return;

        setFriends(friendsData);
        setRequests(requestsData.map(toFriendRequest));
        setError(null);
      })
      .catch(() => {
        if (active) setError('Failed to load friends');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const removeFriend = useCallback(async (friendshipId: number) => {
    let snapshot: Friend[] = [];

    setFriends(curr => {
      snapshot = curr;

      return curr.filter(friend => friend.friendshipId !== friendshipId);
    });

    try {
      await removeFriendApi(friendshipId);
    } catch {
      setFriends(snapshot);
    }
  }, []);

  const acceptRequest = useCallback(async (id: number) => {
    let snapshot: FriendRequest[] = [];

    setRequests(curr => {
      snapshot = curr;

      return curr.filter(request => request.id !== id);
    });

    try {
      await acceptRequestApi(id);
      setFriends(await loadAllFriends());
    } catch {
      setRequests(snapshot);
    }
  }, []);

  const declineRequest = useCallback(async (id: number) => {
    let snapshot: FriendRequest[] = [];

    setRequests(curr => {
      snapshot = curr;

      return curr.filter(request => request.id !== id);
    });

    try {
      await declineRequestApi(id);
    } catch {
      setRequests(snapshot);
    }
  }, []);

  return {
    friends,
    requests,
    isLoading,
    error,
    removeFriend,
    acceptRequest,
    declineRequest,
  };
};
