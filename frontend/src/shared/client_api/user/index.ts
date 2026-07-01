import type { Profile } from '../auth/types';
import { avatarFormData } from '@/shared/lib/avatarFormData';
import type { BackendEvent, Paginated } from '../event';
import type { FriendApi, FriendRequestApi } from './types';

const EVENTS_PAGE_SIZE = 5;
const FRIENDS_PAGE_SIZE = 20;

export type UserEventsTab = 'plans' | 'wishes' | 'archive';

export type UserEventListParams = {
  tab?: UserEventsTab;
  sort?: string;
  title?: string;
  page?: number;
  pageSize?: number;
};

export const listUserEvents = async (
  userId: number,
  params: UserEventListParams = {},
): Promise<Paginated<BackendEvent>> => {
  const { tab, sort, title, page = 1, pageSize = EVENTS_PAGE_SIZE } = params;

  const query = new URLSearchParams();

  query.set('page', String(page));
  query.set('page_size', String(pageSize));

  if (tab) query.set('tab', tab);
  if (sort) query.set('sort', sort);
  if (title) query.set('title', title);

  const res = await fetch(
    `/api/user/users/${userId}/events?${query.toString()}`,
    {
      method: 'GET',
    },
  );

  if (!res.ok) {
    throw new Error('Failed to load events');
  }

  return (await res.json()) as Paginated<BackendEvent>;
};

export const checkUsername = async (
  username: string,
): Promise<{ available: boolean }> => {
  const res = await fetch(
    `/next_api/user/check-username?username=${encodeURIComponent(username)}`,
  );

  if (!res.ok) throw new Error('Failed');

  return res.json();
};

export const onBoard = async (
  username: string,
  firstName: string = '',
  lastName: string = '',
): Promise<void> => {
  const res = await fetch('/next_api/user/onboard', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      first_name: firstName,
      last_name: lastName,
    }),
  });

  if (!res.ok) throw new Error('Failed to onboard');
};

export const changeAvatar = async (
  avatar: string,
): Promise<{ avatar: string }> => {
  const res = await fetch('/next_api/user/avatar', {
    method: 'PATCH',
    body: await avatarFormData(avatar),
  });

  if (!res.ok) throw new Error('Failed to upload avatar');

  return res.json();
};

export type UpdateProfilePayload = Partial<
  Pick<
    Profile,
    | 'username'
    | 'first_name'
    | 'last_name'
    | 'bio'
    | 'is_private'
    | 'social_media_url'
    | 'date_of_birth'
    | 'gender'
  >
>;

export class UpdateProfileError extends Error {
  constructor(public body: Record<string, unknown>) {
    super('Failed to update profile');
  }
}

export const updateProfile = async (
  payload: UpdateProfilePayload,
): Promise<Profile> => {
  const res = await fetch('/next_api/user/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));

    throw new UpdateProfileError(body);
  }

  return res.json();
};

export class ChangePasswordError extends Error {
  constructor(public body: Record<string, unknown>) {
    super('Failed to change password');
  }
}

export const changePassword = async (
  oldPassword: string,
  newPassword: string,
): Promise<void> => {
  const res = await fetch('/next_api/user/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));

    throw new ChangePasswordError(body);
  }
};

export const createInvite = async (): Promise<{ token: string }> => {
  const res = await fetch('/next_api/user/invite', { method: 'POST' });

  if (!res.ok) throw new Error('Failed to create invite');

  return res.json();
};

export class AcceptInviteError extends Error {
  constructor(public body: Record<string, unknown>) {
    super('Failed to accept invite');
  }
}

export const acceptInvite = async (token: string): Promise<void> => {
  const res = await fetch('/next_api/user/invite/use', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));

    throw new AcceptInviteError(body);
  }
};

export const listFriends = async (
  page: number = 1,
  pageSize: number = FRIENDS_PAGE_SIZE,
): Promise<Paginated<FriendApi>> => {
  const query = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  const res = await fetch(`/api/user/friendship/friends?${query.toString()}`);

  if (!res.ok) throw new Error('Failed to load friends');

  return res.json();
};

export const sendFriendRequest = async (receiverId: number): Promise<void> => {
  const res = await fetch('/next_api/user/friendship/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiver_id: receiverId }),
  });

  if (!res.ok) throw new Error('Failed to send friend request');
};

export const listIncomingRequests = async (): Promise<FriendRequestApi[]> => {
  const res = await fetch('/api/user/friendship/incoming');

  if (!res.ok) throw new Error('Failed to load friend requests');

  return res.json();
};

export const listOutgoingRequests = async (): Promise<FriendRequestApi[]> => {
  const res = await fetch('/api/user/friendship/?page_size=1000');

  if (!res.ok) throw new Error('Failed to load friend requests');

  const data = (await res.json()) as Paginated<FriendRequestApi>;

  return data.results.filter(request => request.status === 'pending');
};

export const acceptRequest = async (id: number): Promise<void> => {
  const res = await fetch(`/next_api/user/friendship/${id}/accept`, {
    method: 'POST',
  });

  if (!res.ok) throw new Error('Failed to accept friend request');
};

export const declineRequest = async (id: number): Promise<void> => {
  const res = await fetch(`/next_api/user/friendship/${id}/decline`, {
    method: 'POST',
  });

  if (!res.ok) throw new Error('Failed to decline friend request');
};

export const removeFriend = async (friendshipId: number): Promise<void> => {
  const res = await fetch(`/next_api/user/friendship/${friendshipId}`, {
    method: 'DELETE',
  });

  if (!res.ok) throw new Error('Failed to remove friend');
};
