export type Friend = {
  id: number;
  username: string;
  avatar: string | null;
  friendshipId: number;
};

export type FriendRequest = {
  id: number;
  username: string;
  avatar: string | null;
};
