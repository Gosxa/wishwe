import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/config', () => ({ API_URL: 'http://localhost:8000' }));

const { mapFriend, mapFriendRequest } = await import('@/lib/friends/types');

describe('friend mappers', () => {
  it('maps a backend friend and preserves the friendship id used by delete', () => {
    expect(
      mapFriend({
        id: 7,
        username: 'anya',
        avatar: 'https://cdn.example.com/anya.png',
        friendship_id: 31,
      }),
    ).toEqual({
      id: 7,
      username: 'anya',
      avatarUri: 'https://cdn.example.com/anya.png',
      friendshipId: 31,
    });
  });

  it('maps an incoming request from its sender fields', () => {
    expect(
      mapFriendRequest({
        id: 12,
        sender: 'oleh',
        sender_avatar: null,
        receiver: 'me',
        status: 'pending',
      }),
    ).toEqual({
      id: 12,
      username: 'oleh',
      avatarUri: null,
    });
  });
});
