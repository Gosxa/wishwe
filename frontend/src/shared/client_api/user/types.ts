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
