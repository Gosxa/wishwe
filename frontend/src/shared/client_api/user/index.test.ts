import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const avatarMocks = vi.hoisted(() => ({
  avatarFormData: vi.fn(),
}));

vi.mock('@/shared/lib/avatarFormData', () => ({
  avatarFormData: avatarMocks.avatarFormData,
}));

import type { Profile } from '@/shared/client_api/auth/types';
import { emptyResponse, jsonResponse } from '@/shared/client_api/mockResponse';
import { useUserStore } from '@/shared/store/useUserStore';
import {
  acceptInvite,
  AcceptInviteError,
  acceptRequest,
  changeAvatar,
  changePassword,
  ChangePasswordError,
  checkUsername,
  createInvite,
  declineRequest,
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
  listUserEvents,
  markFeedTourSeen,
  onBoard,
  removeFriend,
  searchProfiles,
  sendFriendRequest,
  SendFriendRequestError,
  updateProfile,
  UpdateProfileError,
} from './index';

const profile: Profile = {
  id: 9,
  user: 'amy@example.com',
  user_id: 9,
  username: 'amy',
  first_name: 'Amy',
  last_name: 'Lee',
  bio: null,
  date_of_birth: null,
  city: null,
  gender: null,
  avatar: null,
  social_media_url: null,
  is_private: false,
  has_seen_feed_tour: false,
};

describe('user client API', () => {
  const fetchMock = vi.fn<typeof fetch>();
  let avatarData: FormData;

  beforeEach(() => {
    fetchMock.mockReset();
    avatarMocks.avatarFormData.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('window', { location: { href: '/profile' } });
    useUserStore.setState({ user: null });

    avatarData = new FormData();
    avatarData.set('avatar', new Blob(['avatar'], { type: 'image/png' }));
    avatarMocks.avatarFormData.mockResolvedValue(avatarData);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists user events with defaults and encoded filters', async () => {
    const page = { count: 0, next: null, previous: null, results: [] };

    fetchMock
      .mockResolvedValueOnce(jsonResponse(page))
      .mockResolvedValueOnce(jsonResponse(page));

    await expect(listUserEvents(42)).resolves.toEqual(page);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/user/users/42/events?page=1&page_size=5',
      { method: 'GET' },
    );

    await listUserEvents(42, {
      tab: 'archive',
      sort: 'date desc',
      title: 'tea & cake/?',
      page: 4,
      pageSize: 12,
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/user/users/42/events?page=4&page_size=12&tab=archive&sort=date+desc&title=tea+%26+cake%2F%3F',
      { method: 'GET' },
    );
  });

  it('checks username availability with safe query encoding', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ available: true }));

    await expect(checkUsername('name +/?&')).resolves.toEqual({
      available: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/next_api/user/check-username?username=name%20%2B%2F%3F%26',
    );
  });

  it('completes onboarding with defaults or supplied names', async () => {
    fetchMock
      .mockResolvedValueOnce(emptyResponse())
      .mockResolvedValueOnce(emptyResponse());

    await expect(onBoard('amy')).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/next_api/user/onboard', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'amy',
        first_name: '',
        last_name: '',
      }),
    });

    await onBoard('amy', 'Amy', 'Lee');
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/next_api/user/onboard', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'amy',
        first_name: 'Amy',
        last_name: 'Lee',
      }),
    });
  });

  it('marks the feed tour as seen', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse());

    await expect(markFeedTourSeen()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('/next_api/user/feed-tour', {
      method: 'POST',
    });
  });

  it('converts and uploads avatar data without setting a JSON header', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ avatar: 'https://cdn.example/avatar.png' }),
    );

    await expect(changeAvatar('data:image/png;base64,abc')).resolves.toEqual({
      avatar: 'https://cdn.example/avatar.png',
    });
    expect(avatarMocks.avatarFormData).toHaveBeenCalledWith(
      'data:image/png;base64,abc',
    );
    expect(fetchMock).toHaveBeenCalledWith('/next_api/user/avatar', {
      method: 'PATCH',
      body: avatarData,
    });
  });

  it('updates a profile with a JSON PATCH request', async () => {
    const updated = { ...profile, bio: 'Ready for an adventure' };
    const payload = {
      bio: 'Ready for an adventure',
      is_private: true,
      date_of_birth: null,
    };

    fetchMock.mockResolvedValueOnce(jsonResponse(updated));

    await expect(updateProfile(payload)).resolves.toEqual(updated);
    expect(fetchMock).toHaveBeenCalledWith('/next_api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  });

  it('changes a password with backend field names', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse());

    await expect(
      changePassword('OldPassword1', 'NewPassword2'),
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('/next_api/user/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        old_password: 'OldPassword1',
        new_password: 'NewPassword2',
      }),
    });
  });

  it('creates and accepts an invite', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ token: 'invite-token' }))
      .mockResolvedValueOnce(emptyResponse());

    await expect(createInvite()).resolves.toEqual({ token: 'invite-token' });
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/next_api/user/invite', {
      method: 'POST',
    });

    await expect(acceptInvite('invite-token')).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/next_api/user/invite/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invite-token' }),
    });
  });

  it('searches profiles and lists friends with encoded pagination', async () => {
    const profiles = {
      count: 1,
      next: null,
      previous: null,
      results: [profile],
    };
    const friends = {
      count: 0,
      next: null,
      previous: null,
      results: [],
    };

    fetchMock
      .mockResolvedValueOnce(jsonResponse(profiles))
      .mockResolvedValueOnce(jsonResponse(friends));

    await expect(searchProfiles('amy +/?', 25)).resolves.toEqual(profiles);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/user/profile?username=amy+%2B%2F%3F&page_size=25',
    );

    await expect(listFriends(3, 40)).resolves.toEqual(friends);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/user/friendship/friends?page=3&page_size=40',
    );
  });

  it('sends a friend request with the receiver ID', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse());

    await expect(sendFriendRequest(99)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('/next_api/user/friendship/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiver_id: 99 }),
    });
  });

  it('extracts the first nested friend-request error and keeps the status', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { receiver_id: [null, { detail: ['Request already pending'] }] },
        409,
      ),
    );

    const failure = sendFriendRequest(99);

    await expect(failure).rejects.toBeInstanceOf(SendFriendRequestError);
    await expect(failure).rejects.toMatchObject({
      status: 409,
      detail: 'Request already pending',
      message: 'Request already pending',
    });
  });

  it('uses the friend-request fallback for an empty error body', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse(500));

    const failure = sendFriendRequest(99);

    await expect(failure).rejects.toBeInstanceOf(SendFriendRequestError);
    await expect(failure).rejects.toMatchObject({
      status: 500,
      detail: null,
      message: 'Failed to send friend request',
    });
  });

  it('lists incoming requests and filters outgoing requests to pending', async () => {
    const incoming = [{ id: 1, status: 'pending' }];
    const outgoingPage = {
      count: 3,
      next: null,
      previous: null,
      results: [
        { id: 2, status: 'pending' },
        { id: 3, status: 'accepted' },
        { id: 4, status: 'declined' },
      ],
    };

    fetchMock
      .mockResolvedValueOnce(jsonResponse(incoming))
      .mockResolvedValueOnce(jsonResponse(outgoingPage));

    await expect(listIncomingRequests()).resolves.toEqual(incoming);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/user/friendship/incoming',
    );

    await expect(listOutgoingRequests()).resolves.toEqual([
      { id: 2, status: 'pending' },
    ]);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/user/friendship/?page_size=1000',
    );
  });

  it.each([
    ['accepts', acceptRequest, '/next_api/user/friendship/12/accept', 'POST'],
    [
      'declines',
      declineRequest,
      '/next_api/user/friendship/12/decline',
      'POST',
    ],
    ['removes', removeFriend, '/next_api/user/friendship/12', 'DELETE'],
  ] as const)(
    '%s a friendship with the expected request',
    async (_, call, url, method) => {
      fetchMock.mockResolvedValueOnce(emptyResponse());

      await expect(call(12)).resolves.toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith(url, { method });
    },
  );

  it.each([
    {
      name: 'profile update',
      errorType: UpdateProfileError,
      call: () => updateProfile({ username: 'taken' }),
    },
    {
      name: 'password change',
      errorType: ChangePasswordError,
      call: () => changePassword('old', 'new'),
    },
    {
      name: 'invite acceptance',
      errorType: AcceptInviteError,
      call: () => acceptInvite('used-token'),
    },
  ])(
    'preserves the structured $name error body',
    async ({ call, errorType }) => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ error: { detail: ['Invalid value'] } }, 400),
      );

      const failure = call();

      await expect(failure).rejects.toBeInstanceOf(errorType);
      await expect(failure).rejects.toMatchObject({
        body: { error: { detail: ['Invalid value'] } },
      });
    },
  );

  it.each([
    {
      name: 'profile update',
      errorType: UpdateProfileError,
      call: () => updateProfile({ username: 'taken' }),
    },
    {
      name: 'password change',
      errorType: ChangePasswordError,
      call: () => changePassword('old', 'new'),
    },
    {
      name: 'invite acceptance',
      errorType: AcceptInviteError,
      call: () => acceptInvite('used-token'),
    },
  ])(
    'uses an empty body for malformed $name errors',
    async ({ call, errorType }) => {
      fetchMock.mockResolvedValueOnce(
        new Response('not-json', {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const failure = call();

      await expect(failure).rejects.toBeInstanceOf(errorType);
      await expect(failure).rejects.toMatchObject({ body: {} });
    },
  );

  it.each([
    ['user events', () => listUserEvents(1), 'Failed to load events'],
    ['username check', () => checkUsername('amy'), 'Failed'],
    ['onboarding', () => onBoard('amy'), 'Failed to onboard'],
    [
      'feed tour',
      () => markFeedTourSeen(),
      'Failed to mark the feed tour as seen',
    ],
    [
      'avatar',
      () => changeAvatar('data:image/png;base64,a'),
      'Failed to upload avatar',
    ],
    ['invite creation', () => createInvite(), 'Failed to create invite'],
    [
      'profile search',
      () => searchProfiles('amy'),
      'Failed to search profiles',
    ],
    ['friends', () => listFriends(), 'Failed to load friends'],
    [
      'incoming requests',
      () => listIncomingRequests(),
      'Failed to load friend requests',
    ],
    [
      'outgoing requests',
      () => listOutgoingRequests(),
      'Failed to load friend requests',
    ],
    [
      'accept request',
      () => acceptRequest(1),
      'Failed to accept friend request',
    ],
    [
      'decline request',
      () => declineRequest(1),
      'Failed to decline friend request',
    ],
    ['remove friend', () => removeFriend(1), 'Failed to remove friend'],
  ] as const)(
    'throws the documented generic error for failed %s',
    async (_, call, message) => {
      fetchMock.mockResolvedValueOnce(jsonResponse({}, 500));

      await expect(call()).rejects.toThrow(message);
    },
  );

  it('clears the user and redirects when any authenticated request returns 401', async () => {
    useUserStore.setState({ user: profile });
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 401));

    await expect(listFriends()).rejects.toThrow('Unauthorized');
    expect(useUserStore.getState().user).toBeNull();
    expect(window.location.href).toBe('/onboard');
  });
});
