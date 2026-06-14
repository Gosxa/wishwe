import type { Profile } from '../auth/types';
import { avatarFormData } from '@/shared/lib/avatarFormData';
import type { BackendEvent, Paginated } from '../event';

const EVENTS_PAGE_SIZE = 20;

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
  Pick<Profile, 'username' | 'first_name' | 'last_name' | 'bio' | 'is_private'>
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
