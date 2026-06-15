import type {
  FriendApi,
  FriendRequestApi,
} from '@/shared/client_api/user/types';
import type { Friend, FriendRequest } from './types';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? '';

export const resolveMediaUrl = (path: string | null): string | null => {
  if (!path) return null;
  if (/^https?:\/\//.test(path) || path.startsWith('data:')) return path;
  if (!BACKEND) return path;

  return `${BACKEND}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const toFriend = (api: FriendApi): Friend => ({
  id: api.id,
  username: api.username ?? '',
  avatar: resolveMediaUrl(api.avatar),
  friendshipId: api.friendship_id,
});

export const toFriendRequest = (api: FriendRequestApi): FriendRequest => ({
  id: api.id,
  username: api.sender,
  avatar: resolveMediaUrl(api.sender_avatar),
});
