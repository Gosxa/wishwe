import type {
  FriendApi,
  FriendRequestApi,
} from '@/shared/client_api/user/types';
import type { Profile } from '@/shared/client_api/auth/types';
import { toAbsoluteMediaUrl } from '@/shared/lib/mediaUrl';
import type { Friend, FriendRequest, SearchResult } from './types';

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

export const toSearchResult = (api: Profile): SearchResult => ({
  userId: api.user_id,
  username: api.username ?? '',
  name: [api.first_name, api.last_name].filter(Boolean).join(' '),
  avatar: toAbsoluteMediaUrl(api.avatar),
});
