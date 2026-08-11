import { beforeEach, describe, expect, it, vi } from 'vitest';

import { backendMocks } from './route-handler-backend-mocks';

import {
  acceptFriendship,
  checkUsername,
  COOKIE,
  context,
  coveredRouteFiles,
  createInvite,
  createShareLink,
  declineFriendship,
  deleteEvent,
  emptyResponse,
  getCategories,
  getEvent,
  getEvents,
  getFriends,
  getFriendships,
  getIncomingFriendships,
  getNotifications,
  getParticipants,
  getProfiles,
  getUnreadCount,
  getUserEvents,
  jsonRequest,
  jsonResponse,
  malformedJsonRequest,
  markFeedTourSeen,
  readAllNotifications,
  removeFriendship,
  request,
  requestWithCookie,
  routeFiles,
  runEventAction,
  sendFriendship,
} from './route-handler-test-kit';

vi.mock('@/app/_server/api/backend', async () => {
  const { backendMocks: mocks } = await import('./route-handler-backend-mocks');

  return { beApi: mocks };
});

describe('route handler inventory', () => {
  it('keeps every live route in the contract suite', () => {
    expect(Object.keys(routeFiles).sort()).toEqual(coveredRouteFiles);
    expect(coveredRouteFiles).toHaveLength(37);
  });
});

describe('simple forwarding route handlers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const forwardingCases = [
    {
      name: 'GET /api/event/category',
      mock: backendMocks.event.categories,
      invoke: () => getCategories(),
      args: [],
    },
    {
      name: 'POST /api/event/events/:id/:action',
      mock: backendMocks.event.action,
      invoke: () =>
        runEventAction(
          requestWithCookie('/api/event/events/evt-1/join_plan', 'POST'),
          context({ id: 'evt-1', action: 'join_plan' }),
        ),
      args: ['evt-1', 'join_plan', COOKIE],
    },
    {
      name: 'GET /api/event/events/:id/participants',
      mock: backendMocks.event.participants,
      invoke: () =>
        getParticipants(
          requestWithCookie('/api/event/events/evt-2/participants'),
          context({ id: 'evt-2' }),
        ),
      args: ['evt-2', COOKIE],
    },
    {
      name: 'GET /api/event/events/:id',
      mock: backendMocks.event.get,
      invoke: () =>
        getEvent(
          requestWithCookie('/api/event/events/evt-3'),
          context({ id: 'evt-3' }),
        ),
      args: ['evt-3', COOKIE],
    },
    {
      name: 'GET /api/event/events with ordered repeated query parameters',
      mock: backendMocks.event.list,
      invoke: () =>
        getEvents(
          requestWithCookie(
            '/api/event/events?search=amy%20lee&tag=a%2Fb&tag=c',
          ),
        ),
      args: ['search=amy+lee&tag=a%2Fb&tag=c', COOKIE],
    },
    {
      name: 'GET /api/notifications',
      mock: backendMocks.notifications.list,
      invoke: () => getNotifications(requestWithCookie('/api/notifications')),
      args: [COOKIE],
    },
    {
      name: 'GET /api/notifications/unread_count',
      mock: backendMocks.notifications.unreadCount,
      invoke: () =>
        getUnreadCount(requestWithCookie('/api/notifications/unread_count')),
      args: [COOKIE],
    },
    {
      name: 'GET /api/user/friendship/friends with query parameters',
      mock: backendMocks.user.friendshipFriends,
      invoke: () =>
        getFriends(
          requestWithCookie('/api/user/friendship/friends?page=2&search=a+b'),
        ),
      args: ['page=2&search=a+b', COOKIE],
    },
    {
      name: 'GET /api/user/friendship/incoming',
      mock: backendMocks.user.friendshipIncoming,
      invoke: () =>
        getIncomingFriendships(
          requestWithCookie('/api/user/friendship/incoming'),
        ),
      args: [COOKIE],
    },
    {
      name: 'GET /api/user/friendship without query parameters',
      mock: backendMocks.user.friendshipList,
      invoke: () => getFriendships(requestWithCookie('/api/user/friendship')),
      args: ['', COOKIE],
    },
    {
      name: 'GET /api/user/profile with query parameters',
      mock: backendMocks.user.profileList,
      invoke: () =>
        getProfiles(
          requestWithCookie('/api/user/profile?search=amy&is_private=false'),
        ),
      args: ['search=amy&is_private=false', COOKIE],
    },
    {
      name: 'GET /api/user/users/:id/events with path and query parameters',
      mock: backendMocks.user.events,
      invoke: () =>
        getUserEvents(
          requestWithCookie('/api/user/users/user-9/events?type=wish&page=3'),
          context({ id: 'user-9' }),
        ),
      args: ['user-9', 'type=wish&page=3', COOKIE],
    },
    {
      name: 'POST /next_api/notifications/read-all',
      mock: backendMocks.notifications.readAll,
      invoke: () =>
        readAllNotifications(
          requestWithCookie('/next_api/notifications/read-all', 'POST'),
        ),
      args: [COOKIE],
    },
    {
      name: 'GET /next_api/user/check-username',
      mock: backendMocks.user.checkUsername,
      invoke: () =>
        checkUsername(
          request('/next_api/user/check-username?username=name%20%2B%2F%3F'),
        ),
      args: ['name +/?'],
    },
    {
      name: 'POST /next_api/event/:id/share',
      mock: backendMocks.event.createShareLink,
      invoke: () =>
        createShareLink(
          requestWithCookie('/next_api/event/evt-4/share', 'POST'),
          context({ id: 'evt-4' }),
        ),
      args: ['evt-4', COOKIE],
    },
    {
      name: 'POST /next_api/user/friendship/:id/accept',
      mock: backendMocks.user.friendshipAccept,
      invoke: () =>
        acceptFriendship(
          requestWithCookie(
            '/next_api/user/friendship/friend-1/accept',
            'POST',
          ),
          context({ id: 'friend-1' }),
        ),
      args: ['friend-1', COOKIE],
    },
    {
      name: 'POST /next_api/user/friendship/:id/decline',
      mock: backendMocks.user.friendshipDecline,
      invoke: () =>
        declineFriendship(
          requestWithCookie(
            '/next_api/user/friendship/friend-2/decline',
            'POST',
          ),
          context({ id: 'friend-2' }),
        ),
      args: ['friend-2', COOKIE],
    },
    {
      name: 'POST /next_api/user/invite',
      mock: backendMocks.user.invite,
      invoke: () =>
        createInvite(requestWithCookie('/next_api/user/invite', 'POST')),
      args: [COOKIE],
    },
  ];

  it.each(forwardingCases)(
    '$name preserves a backend error status and body',
    async ({ mock, invoke, args }) => {
      const backendBody = {
        detail: 'Django rejected the request',
        errors: { field: ['invalid'] },
      };

      mock.mockResolvedValueOnce(jsonResponse(backendBody, 422));

      const response = await invoke();

      expect(mock).toHaveBeenCalledOnce();
      expect(mock).toHaveBeenCalledWith(...args);
      expect(response.status).toBe(422);
      await expect(response.json()).resolves.toEqual(backendBody);
    },
  );

  it.each([
    ['join_plan'],
    ['interested_in_wish'],
    ['leave_event'],
    ['archive_plan'],
  ])('allows the %s event action', async action => {
    backendMocks.event.action.mockResolvedValueOnce(jsonResponse({ ok: true }));

    await runEventAction(
      requestWithCookie(`/api/event/events/12/${action}`, 'POST'),
      context({ id: '12', action }),
    );

    expect(backendMocks.event.action).toHaveBeenCalledWith(
      '12',
      action,
      COOKIE,
    );
  });

  it('rejects an unknown event action before calling Django', async () => {
    const response = await runEventAction(
      requestWithCookie('/api/event/events/12/delete_everything', 'POST'),
      context({ id: '12', action: 'delete_everything' }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ detail: 'Not found.' });
    expect(backendMocks.event.action).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: 'event deletion',
      mock: backendMocks.event.remove,
      invoke: () =>
        deleteEvent(
          requestWithCookie('/api/event/events/evt-5', 'DELETE'),
          context({ id: 'evt-5' }),
        ),
      args: ['evt-5', COOKIE],
    },
    {
      name: 'friendship removal',
      mock: backendMocks.user.friendshipRemove,
      invoke: () =>
        removeFriendship(
          requestWithCookie('/next_api/user/friendship/friend-3', 'DELETE'),
          context({ id: 'friend-3' }),
        ),
      args: ['friend-3', COOKIE],
    },
  ])('returns an empty response for $name', async ({ mock, invoke, args }) => {
    mock.mockResolvedValueOnce(emptyResponse());

    const response = await invoke();

    expect(mock).toHaveBeenCalledWith(...args);
    expect(response.status).toBe(204);
    await expect(response.text()).resolves.toBe('');
  });

  it('handles the expected empty feed-tour response', async () => {
    backendMocks.user.feedTourSeen.mockResolvedValueOnce(emptyResponse());

    const response = await markFeedTourSeen(
      requestWithCookie('/next_api/user/feed-tour', 'POST'),
    );

    expect(backendMocks.user.feedTourSeen).toHaveBeenCalledWith(COOKIE);
    expect(response.status).toBe(204);
    await expect(response.text()).resolves.toBe('');
  });

  it('preserves a feed-tour error with an empty non-204 body', async () => {
    backendMocks.user.feedTourSeen.mockResolvedValueOnce(
      new Response('not-json', { status: 502 }),
    );

    const response = await markFeedTourSeen(
      requestWithCookie('/next_api/user/feed-tour', 'POST'),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({});
  });

  it('forwards valid friendship JSON and cookies', async () => {
    const body = { receiver_id: 44, message: 'Hello' };

    backendMocks.user.friendshipSend.mockResolvedValueOnce(
      jsonResponse({ id: 91 }, 201),
    );

    const response = await sendFriendship(
      jsonRequest('/next_api/user/friendship/send', body, 'POST', COOKIE),
    );

    expect(backendMocks.user.friendshipSend).toHaveBeenCalledWith(body, COOKIE);
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: 91 });
  });

  it('normalizes malformed friendship JSON and an empty backend body', async () => {
    backendMocks.user.friendshipSend.mockResolvedValueOnce(
      new Response(null, { status: 400 }),
    );

    const response = await sendFriendship(
      malformedJsonRequest('/next_api/user/friendship/send'),
    );

    expect(backendMocks.user.friendshipSend).toHaveBeenCalledWith({}, COOKIE);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({});
  });

  it.each([
    {
      name: 'a GET route',
      mock: backendMocks.event.list,
      invoke: () => getEvents(request('/api/event/events')),
      args: ['', ''],
    },
    {
      name: 'a POST route',
      mock: backendMocks.notifications.readAll,
      invoke: () =>
        readAllNotifications(request('/next_api/notifications/read-all')),
      args: [''],
    },
    {
      name: 'a dynamic route',
      mock: backendMocks.event.participants,
      invoke: () =>
        getParticipants(
          request('/api/event/events/21/participants'),
          context({ id: '21' }),
        ),
      args: ['21', ''],
    },
  ])(
    'forwards an empty cookie string for $name',
    async ({ mock, invoke, args }) => {
      mock.mockResolvedValueOnce(jsonResponse({ ok: true }));

      await invoke();

      expect(mock).toHaveBeenCalledWith(...args);
    },
  );

  it.each([
    {
      name: 'a public route',
      mock: backendMocks.event.categories,
      invoke: () => getCategories(),
    },
    {
      name: 'an authenticated list route',
      mock: backendMocks.user.profileList,
      invoke: () => getProfiles(requestWithCookie('/api/user/profile')),
    },
    {
      name: 'a dynamic mutation route',
      mock: backendMocks.user.friendshipAccept,
      invoke: () =>
        acceptFriendship(
          requestWithCookie('/next_api/user/friendship/7/accept', 'POST'),
          context({ id: '7' }),
        ),
    },
  ])(
    'propagates an unexpected backend failure from $name',
    async ({ mock, invoke }) => {
      const failure = new TypeError('backend unavailable');

      mock.mockRejectedValueOnce(failure);

      await expect(invoke()).rejects.toBe(failure);
    },
  );

  it('does not disguise malformed JSON returned by a JSON endpoint', async () => {
    backendMocks.event.categories.mockResolvedValueOnce(
      new Response('<html>bad gateway</html>', { status: 502 }),
    );

    await expect(getCategories()).rejects.toBeInstanceOf(SyntaxError);
  });
});
