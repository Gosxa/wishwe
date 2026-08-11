/// <reference types="vite/client" />

import { NextRequest } from 'next/server';

export { GET as getCategories } from './api/event/category/route';
export { POST as runEventAction } from './api/event/events/[id]/[action]/route';
export { GET as getParticipants } from './api/event/events/[id]/participants/route';
export {
  DELETE as deleteEvent,
  GET as getEvent,
} from './api/event/events/[id]/route';
export { GET as getEvents } from './api/event/events/route';
export { GET as getNotifications } from './api/notifications/route';
export { GET as getUnreadCount } from './api/notifications/unread_count/route';
export { GET as getFriends } from './api/user/friendship/friends/route';
export { GET as getIncomingFriendships } from './api/user/friendship/incoming/route';
export { GET as getFriendships } from './api/user/friendship/route';
export { GET as getProfiles } from './api/user/profile/route';
export { GET as getUserEvents } from './api/user/users/[id]/events/route';
export { POST as checkEmail } from './next_api/auth/check-email/route';
export { POST as googleAuth } from './next_api/auth/google/route';
export { POST as login } from './next_api/auth/login/route';
export { POST as logout } from './next_api/auth/logout/route';
export { POST as register } from './next_api/auth/register/route';
export { POST as resetPassword } from './next_api/auth/reset-password/route';
export { POST as setNewPassword } from './next_api/auth/set-new-password/route';
export { POST as verifyCode } from './next_api/auth/verify-code/route';
export { POST as convertEvent } from './next_api/event/[id]/convert/route';
export { PATCH as updateEvent } from './next_api/event/[id]/route';
export { POST as createShareLink } from './next_api/event/[id]/share/route';
export { POST as createEvent } from './next_api/event/route';
export { POST as readAllNotifications } from './next_api/notifications/read-all/route';
export { PATCH as updateAvatar } from './next_api/user/avatar/route';
export { POST as changePassword } from './next_api/user/change-password/route';
export { GET as checkUsername } from './next_api/user/check-username/route';
export { POST as markFeedTourSeen } from './next_api/user/feed-tour/route';
export { POST as acceptFriendship } from './next_api/user/friendship/[id]/accept/route';
export { POST as declineFriendship } from './next_api/user/friendship/[id]/decline/route';
export { DELETE as removeFriendship } from './next_api/user/friendship/[id]/route';
export { POST as sendFriendship } from './next_api/user/friendship/send/route';
export { POST as createInvite } from './next_api/user/invite/route';
export { POST as consumeInvite } from './next_api/user/invite/use/route';
export { PATCH as onboardUser } from './next_api/user/onboard/route';
export { PATCH as updateProfile } from './next_api/user/profile/route';

export const COOKIE = 'access_token=access; refresh_token=refresh; theme=dark';

export const jsonResponse = (
  body: unknown,
  status = 200,
  setCookies: string[] = [],
) => {
  const headers = new Headers({ 'content-type': 'application/json' });

  setCookies.forEach(cookie => headers.append('set-cookie', cookie));

  return new Response(JSON.stringify(body), { status, headers });
};

export const emptyResponse = (status = 204) => new Response(null, { status });

type NextRequestInit = ConstructorParameters<typeof NextRequest>[1];

export const request = (path: string, init?: NextRequestInit) =>
  new NextRequest(`https://wishwe.test${path}`, init);

export const requestWithCookie = (
  path: string,
  method: string = 'GET',
  cookie: string = COOKIE,
) =>
  request(path, {
    method,
    headers: cookie === '' ? undefined : { cookie },
  });

export const jsonRequest = (
  path: string,
  body: unknown,
  method = 'POST',
  cookie?: string,
) =>
  request(path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(cookie === undefined ? {} : { cookie }),
    },
    body: JSON.stringify(body),
  });

export const malformedJsonRequest = (path: string, method = 'POST') =>
  request(path, {
    method,
    headers: { 'content-type': 'application/json', cookie: COOKIE },
    body: '{"incomplete":',
  });

export const context = <T extends Record<string, string>>(params: T) => ({
  params: Promise.resolve(params),
});

export const routeFiles = import.meta.glob([
  './api/**/route.ts',
  './next_api/**/route.ts',
]);

export const coveredRouteFiles = [
  './api/event/category/route.ts',
  './api/event/events/[id]/[action]/route.ts',
  './api/event/events/[id]/participants/route.ts',
  './api/event/events/[id]/route.ts',
  './api/event/events/route.ts',
  './api/notifications/route.ts',
  './api/notifications/unread_count/route.ts',
  './api/user/friendship/friends/route.ts',
  './api/user/friendship/incoming/route.ts',
  './api/user/friendship/route.ts',
  './api/user/profile/route.ts',
  './api/user/users/[id]/events/route.ts',
  './next_api/auth/check-email/route.ts',
  './next_api/auth/google/route.ts',
  './next_api/auth/login/route.ts',
  './next_api/auth/logout/route.ts',
  './next_api/auth/register/route.ts',
  './next_api/auth/reset-password/route.ts',
  './next_api/auth/set-new-password/route.ts',
  './next_api/auth/verify-code/route.ts',
  './next_api/event/[id]/convert/route.ts',
  './next_api/event/[id]/route.ts',
  './next_api/event/[id]/share/route.ts',
  './next_api/event/route.ts',
  './next_api/notifications/read-all/route.ts',
  './next_api/user/avatar/route.ts',
  './next_api/user/change-password/route.ts',
  './next_api/user/check-username/route.ts',
  './next_api/user/feed-tour/route.ts',
  './next_api/user/friendship/[id]/accept/route.ts',
  './next_api/user/friendship/[id]/decline/route.ts',
  './next_api/user/friendship/[id]/route.ts',
  './next_api/user/friendship/send/route.ts',
  './next_api/user/invite/route.ts',
  './next_api/user/invite/use/route.ts',
  './next_api/user/onboard/route.ts',
  './next_api/user/profile/route.ts',
].sort();
