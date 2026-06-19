import type {
  FriendApi,
  FriendRequestApi,
} from '@/shared/client_api/user/types';
import { toAbsoluteMediaUrl } from '@/shared/lib/mediaUrl';
import type { Friend, FriendRequest } from './types';

export const toFriend = (api: FriendApi): Friend => ({
  id: api.id,
  username: api.username ?? '',
  avatar: toAbsoluteMediaUrl(api.avatar),
  friendshipId: api.friendship_id,
});

export const toFriendRequest = (api: FriendRequestApi): FriendRequest => ({
  id: api.id,
  username: api.sender,
  avatar: toAbsoluteMediaUrl(api.sender_avatar),
});
