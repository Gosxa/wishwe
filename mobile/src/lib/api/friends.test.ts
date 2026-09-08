import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  acceptFriendRequest,
  declineFriendRequest,
  listFriends,
  listIncomingFriendRequests,
  removeFriend,
} from '@/lib/api/friends';

const apiRequestMock = vi.fn();

vi.mock('@/lib/api/client', () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

describe('friends api', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it('lists friends with pagination parameters', async () => {
    apiRequestMock.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });

    await listFriends(2);

    expect(apiRequestMock).toHaveBeenCalledWith(
      '/api/user/friendship/friends/?page=2&page_size=20',
      { auth: true },
    );
  });

  it('lists incoming friend requests', async () => {
    apiRequestMock.mockResolvedValue([]);

    await listIncomingFriendRequests();

    expect(apiRequestMock).toHaveBeenCalledWith('/api/user/friendship/incoming/', {
      auth: true,
    });
  });

  it('calls delete endpoint with friendship id and trailing slash', async () => {
    apiRequestMock.mockResolvedValue(null);

    await removeFriend(42);

    expect(apiRequestMock).toHaveBeenCalledWith('/api/user/friendship/42/', {
      method: 'DELETE',
      auth: true,
    });
  });

  it('accepts incoming friend request', async () => {
    apiRequestMock.mockResolvedValue({ detail: 'Accepted' });

    await acceptFriendRequest(15);

    expect(apiRequestMock).toHaveBeenCalledWith('/api/user/friendship/15/accept/', {
      method: 'POST',
      auth: true,
    });
  });

  it('declines incoming friend request', async () => {
    apiRequestMock.mockResolvedValue({ success: 'Declined' });

    await declineFriendRequest(15);

    expect(apiRequestMock).toHaveBeenCalledWith('/api/user/friendship/15/decline/', {
      method: 'POST',
      auth: true,
    });
  });
});
