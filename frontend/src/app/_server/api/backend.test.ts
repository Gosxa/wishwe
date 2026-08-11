import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { beApi } from './backend';

const fetchMock =
  vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
const COOKIE = 'access_token=access; refresh_token=refresh; theme=dark';
const BODY = { value: 'payload', nested: { enabled: true } };

const jsonRequest = (
  method: 'POST' | 'PATCH',
  body: unknown,
  cookie?: string,
): RequestInit => ({
  method,
  headers: {
    'Content-Type': 'application/json',
    ...(cookie === undefined ? {} : { cookie }),
  },
  body: JSON.stringify(body),
  cache: 'no-store',
});

const cookieRequest = (
  cookie: string,
  method?: 'POST' | 'DELETE',
): RequestInit => ({
  ...(method === undefined ? {} : { method }),
  headers: { cookie },
  cache: 'no-store',
});

type BoundaryCase = {
  name: string;
  call: () => Promise<Response>;
  path: string;
  init: RequestInit;
};

const formData = new FormData();

formData.set('title', 'A multipart event');

const cases: BoundaryCase[] = [
  {
    name: 'starts email authentication',
    call: () => beApi.auth.emailStart(BODY),
    path: '/api/user/auth/email-start/',
    init: jsonRequest('POST', BODY),
  },
  {
    name: 'verifies an email code',
    call: () => beApi.auth.verifyCode(BODY),
    path: '/api/user/auth/verify-code/',
    init: jsonRequest('POST', BODY),
  },
  {
    name: 'authenticates with Google',
    call: () => beApi.auth.google(BODY),
    path: '/api/user/auth/google/',
    init: jsonRequest('POST', BODY),
  },
  {
    name: 'gets tokens',
    call: () => beApi.auth.getTokens(BODY),
    path: '/api/user/auth/token/',
    init: jsonRequest('POST', BODY),
  },
  {
    name: 'sets a password',
    call: () => beApi.auth.setPassword(BODY),
    path: '/api/user/auth/set-password/',
    init: jsonRequest('POST', BODY),
  },
  {
    name: 'starts a password reset',
    call: () => beApi.auth.resetPassword(BODY),
    path: '/api/user/auth/reset-password/',
    init: jsonRequest('POST', BODY),
  },
  {
    name: 'sets a new password',
    call: () => beApi.auth.setNewPassword(BODY),
    path: '/api/user/auth/set-new-password/',
    init: jsonRequest('POST', BODY),
  },
  {
    name: 'refreshes tokens with cookies',
    call: () => beApi.auth.refreshToken(COOKIE),
    path: '/api/user/auth/token/refresh/',
    init: cookieRequest(COOKIE, 'POST'),
  },
  {
    name: 'logs out with JSON and cookies',
    call: () => beApi.auth.logout(BODY, COOKIE),
    path: '/api/user/auth/logout/',
    init: jsonRequest('POST', BODY, COOKIE),
  },
  {
    name: 'gets the current profile',
    call: () => beApi.user.me(COOKIE),
    path: '/api/user/profile/me/',
    init: cookieRequest(COOKIE),
  },
  {
    name: 'completes onboarding',
    call: () => beApi.user.onboarding(BODY, COOKIE),
    path: '/api/user/profile/onboarding/',
    init: jsonRequest('PATCH', BODY, COOKIE),
  },
  {
    name: 'updates a profile',
    call: () => beApi.user.updateProfile(BODY, COOKIE),
    path: '/api/user/profile/update_profile/',
    init: jsonRequest('PATCH', BODY, COOKIE),
  },
  {
    name: 'changes a password',
    call: () => beApi.user.changePassword(BODY, COOKIE),
    path: '/api/user/profile/change-password/',
    init: jsonRequest('POST', BODY, COOKIE),
  },
  {
    name: 'uploads an avatar without overriding the multipart boundary',
    call: () => beApi.user.avatar(formData, COOKIE),
    path: '/api/user/profile/avatar/',
    init: {
      method: 'PATCH',
      headers: { cookie: COOKIE },
      body: formData,
      cache: 'no-store',
    },
  },
  {
    name: 'records that the feed tour was seen',
    call: () => beApi.user.feedTourSeen(COOKIE),
    path: '/api/user/profile/feed-tour-seen/',
    init: cookieRequest(COOKIE, 'POST'),
  },
  {
    name: 'encodes a username query parameter',
    call: () => beApi.user.checkUsername('name +/?&'),
    path: '/api/username-check/?username=name%20%2B%2F%3F%26',
    init: { cache: 'no-store' },
  },
  {
    name: 'creates an invite',
    call: () => beApi.user.invite(COOKIE),
    path: '/api/user/invite/',
    init: cookieRequest(COOKIE, 'POST'),
  },
  {
    name: 'encodes an invite-details path token',
    call: () => beApi.user.inviteDetails('token/with spaces?'),
    path: '/api/user/invite/token%2Fwith%20spaces%3F/details/',
    init: { cache: 'no-store' },
  },
  {
    name: 'uses an invite',
    call: () => beApi.user.inviteUse('invite-token', COOKIE),
    path: '/api/user/invite/use/',
    init: jsonRequest('POST', { token: 'invite-token' }, COOKIE),
  },
  {
    name: 'lists profiles with a query string',
    call: () => beApi.user.profileList('search=amy&page=2', COOKIE),
    path: '/api/user/profile/?search=amy&page=2',
    init: cookieRequest(COOKIE),
  },
  {
    name: 'lists profiles without a dangling question mark',
    call: () => beApi.user.profileList('', COOKIE),
    path: '/api/user/profile/',
    init: cookieRequest(COOKIE),
  },
  {
    name: 'lists a user event path and query',
    call: () => beApi.user.events('42', 'type=wish&page=3', COOKIE),
    path: '/api/user/users/42/events/?type=wish&page=3',
    init: cookieRequest(COOKIE),
  },
  {
    name: 'lists friends with a query string',
    call: () => beApi.user.friendshipFriends('page=2', COOKIE),
    path: '/api/user/friendship/friends/?page=2',
    init: cookieRequest(COOKIE),
  },
  {
    name: 'lists incoming friendship requests',
    call: () => beApi.user.friendshipIncoming(COOKIE),
    path: '/api/user/friendship/incoming/',
    init: cookieRequest(COOKIE),
  },
  {
    name: 'lists friendship records with a query string',
    call: () => beApi.user.friendshipList('status=pending', COOKIE),
    path: '/api/user/friendship/?status=pending',
    init: cookieRequest(COOKIE),
  },
  {
    name: 'accepts a friendship',
    call: () => beApi.user.friendshipAccept('101', COOKIE),
    path: '/api/user/friendship/101/accept/',
    init: cookieRequest(COOKIE, 'POST'),
  },
  {
    name: 'declines a friendship',
    call: () => beApi.user.friendshipDecline('102', COOKIE),
    path: '/api/user/friendship/102/decline/',
    init: cookieRequest(COOKIE, 'POST'),
  },
  {
    name: 'removes a friendship',
    call: () => beApi.user.friendshipRemove('103', COOKIE),
    path: '/api/user/friendship/103/',
    init: cookieRequest(COOKIE, 'DELETE'),
  },
  {
    name: 'sends a friendship request',
    call: () => beApi.user.friendshipSend(BODY, COOKIE),
    path: '/api/user/friendship/send/',
    init: jsonRequest('POST', BODY, COOKIE),
  },
  {
    name: 'lists events with a query string',
    call: () => beApi.event.list('ordering=-created_at', COOKIE),
    path: '/api/event/events/?ordering=-created_at',
    init: cookieRequest(COOKIE),
  },
  {
    name: 'gets an event',
    call: () => beApi.event.get('201', COOKIE),
    path: '/api/event/events/201/',
    init: cookieRequest(COOKIE),
  },
  {
    name: 'deletes an event',
    call: () => beApi.event.remove('202', COOKIE),
    path: '/api/event/events/202/',
    init: cookieRequest(COOKIE, 'DELETE'),
  },
  {
    name: 'lists categories without credentials',
    call: () => beApi.event.categories(),
    path: '/api/event/category/',
    init: { cache: 'no-store' },
  },
  {
    name: 'performs an event action',
    call: () => beApi.event.action('203', 'join_plan', COOKIE),
    path: '/api/event/events/203/join_plan/',
    init: cookieRequest(COOKIE, 'POST'),
  },
  {
    name: 'gets event participants',
    call: () => beApi.event.participants('204', COOKIE),
    path: '/api/event/events/204/participants/',
    init: cookieRequest(COOKIE),
  },
  {
    name: 'encodes a public share token and omits absent credentials',
    call: () => beApi.event.shared('share/token ?'),
    path: '/api/event/share/share%2Ftoken%20%3F/',
    init: { headers: undefined, cache: 'no-store' },
  },
  {
    name: 'forwards optional credentials to a shared event',
    call: () => beApi.event.shared('share-token', COOKIE),
    path: '/api/event/share/share-token/',
    init: cookieRequest(COOKIE),
  },
  {
    name: 'creates an event share link',
    call: () => beApi.event.createShareLink('205', COOKIE),
    path: '/api/event/events/205/share/',
    init: cookieRequest(COOKIE, 'POST'),
  },
  {
    name: 'creates a JSON plan',
    call: () => beApi.event.create('plan', BODY, COOKIE),
    path: '/api/event/events/create_plan/',
    init: jsonRequest('POST', BODY, COOKIE),
  },
  {
    name: 'creates a multipart wish without overriding the boundary',
    call: () => beApi.event.create('wish', formData, COOKIE),
    path: '/api/event/events/create_wish/',
    init: {
      method: 'POST',
      headers: { cookie: COOKIE },
      body: formData,
      cache: 'no-store',
    },
  },
  {
    name: 'updates a JSON wish',
    call: () => beApi.event.update('206', 'wish', BODY, COOKIE),
    path: '/api/event/events/206/update_wish/',
    init: jsonRequest('PATCH', BODY, COOKIE),
  },
  {
    name: 'updates a multipart plan without overriding the boundary',
    call: () => beApi.event.update('207', 'plan', formData, COOKIE),
    path: '/api/event/events/207/update_plan/',
    init: {
      method: 'PATCH',
      headers: { cookie: COOKIE },
      body: formData,
      cache: 'no-store',
    },
  },
  {
    name: 'converts a wish to a plan',
    call: () => beApi.event.convert('208', BODY, COOKIE),
    path: '/api/event/events/208/convert_to_plan/',
    init: jsonRequest('POST', BODY, COOKIE),
  },
  {
    name: 'lists notifications',
    call: () => beApi.notifications.list(COOKIE),
    path: '/api/notifications/?page_size=10',
    init: cookieRequest(COOKIE),
  },
  {
    name: 'gets the unread notification count',
    call: () => beApi.notifications.unreadCount(COOKIE),
    path: '/api/notifications/unread_count/',
    init: cookieRequest(COOKIE),
  },
  {
    name: 'marks every notification as read',
    call: () => beApi.notifications.readAll(COOKIE),
    path: '/api/notifications/read_all/',
    init: cookieRequest(COOKIE, 'POST'),
  },
];

describe('beApi Next/Django boundary', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it.each(cases)('$name', async ({ call, path, init }) => {
    const response = await call();

    expect(response.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(`${BACKEND}${path}`, init);
  });

  it('reads a configured backend origin when the module is initialized', async () => {
    vi.stubEnv('NEXT_PUBLIC_BACKEND_URL', 'https://django.internal.example');
    vi.resetModules();

    const { beApi: configuredApi } = await import('./backend');

    await configuredApi.event.categories();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://django.internal.example/api/event/category/',
      { cache: 'no-store' },
    );
  });

  it('returns the original fetch promise rejection to its caller', async () => {
    const failure = new TypeError('fetch failed');

    fetchMock.mockRejectedValueOnce(failure);

    await expect(beApi.user.me(COOKIE)).rejects.toBe(failure);
  });
});
