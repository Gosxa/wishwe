export type FriendApi = {
  id: number;
  username: string | null;
  avatar: string | null;
  friendship_id: number;
};

export type FriendRequestApi = {
  id: number;
  sender: string;
  sender_avatar: string | null;
  receiver: string;
  status: 'pending' | 'accepted' | 'rejected';
};

export type FriendshipStatus =
  | 'self'
  | 'friends'
  | 'requested'
  | 'incoming_request'
  | 'none';

export type PublicProfile = {
  user_id: number;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  is_private: boolean;
  friendship_status: FriendshipStatus;
};
