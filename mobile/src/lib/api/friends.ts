import { apiRequest } from '@/lib/api/client';

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type BackendFriend = {
  id: number;
  username: string;
  avatar: string | null;
  friendship_id: number;
};

export type BackendFriendRequest = {
  id: number;
  sender: string;
  sender_avatar: string | null;
  receiver: string;
  status: 'pending' | 'accepted' | 'rejected';
};

const PAGE_SIZE = 20;

export function listFriends(page = 1): Promise<Paginated<BackendFriend>> {
  return apiRequest<Paginated<BackendFriend>>(
    `/api/user/friendship/friends/?page=${page}&page_size=${PAGE_SIZE}`,
    { auth: true },
  );
}

export function listIncomingFriendRequests(): Promise<BackendFriendRequest[]> {
  return apiRequest<BackendFriendRequest[]>('/api/user/friendship/incoming/', {
    auth: true,
  });
}

export function removeFriend(friendshipId: number): Promise<unknown> {
  return apiRequest(`/api/user/friendship/${friendshipId}/`, {
    method: 'DELETE',
    auth: true,
  });
}

function respondToFriendRequest(
  id: number,
  action: 'accept' | 'decline',
): Promise<unknown> {
  return apiRequest(`/api/user/friendship/${id}/${action}/`, {
    method: 'POST',
    auth: true,
  });
}

export const acceptFriendRequest = (id: number) =>
  respondToFriendRequest(id, 'accept');

export const declineFriendRequest = (id: number) =>
  respondToFriendRequest(id, 'decline');
