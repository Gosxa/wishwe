import type { BackendFriend, BackendFriendRequest } from '@/lib/api/friends';
import { toAbsoluteMediaUrl } from '@/lib/api/media';

export type Friend = {
  id: number;
  friendshipId: number;
  username: string;
  avatarUri: string | null;
};

export type FriendRequest = {
  id: number;
  username: string;
  avatarUri: string | null;
};

export function mapFriend(friend: BackendFriend): Friend {
  return {
    id: friend.id,
    friendshipId: friend.friendship_id,
    username: friend.username,
    avatarUri: toAbsoluteMediaUrl(friend.avatar),
  };
}

export function mapFriendRequest(request: BackendFriendRequest): FriendRequest {
  return {
    id: request.id,
    username: request.sender,
    avatarUri: toAbsoluteMediaUrl(request.sender_avatar),
  };
}
