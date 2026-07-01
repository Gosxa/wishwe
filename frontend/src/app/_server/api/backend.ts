const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

const post = (url: string, body: unknown) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

const patch = (url: string, body: unknown, cookieHeader: string) =>
  fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

export const beApi = {
  auth: {
    emailStart: (body: unknown) =>
      post(`${BACKEND}/api/user/auth/email-start/`, body),

    verifyCode: (body: unknown) =>
      post(`${BACKEND}/api/user/auth/verify-code/`, body),

    google: (body: unknown) => post(`${BACKEND}/api/user/auth/google/`, body),

    getTokens: (body: unknown) => post(`${BACKEND}/api/user/auth/token/`, body),

    setPassword: (body: unknown) =>
      post(`${BACKEND}/api/user/auth/set-password/`, body),

    resetPassword: (body: unknown) =>
      post(`${BACKEND}/api/user/auth/reset-password/`, body),

    setNewPassword: (body: unknown) =>
      post(`${BACKEND}/api/user/auth/set-new-password/`, body),

    refreshToken: (cookieHeader: string) =>
      fetch(`${BACKEND}/api/user/auth/token/refresh/`, {
        method: 'POST',
        headers: { cookie: cookieHeader },
        cache: 'no-store',
      }),

    logout: (body: unknown, cookieHeader: string) =>
      fetch(`${BACKEND}/api/user/auth/logout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify(body),
        cache: 'no-store',
      }),
  },

  user: {
    me: (cookieHeader: string) =>
      fetch(`${BACKEND}/api/user/profile/me/`, {
        headers: { cookie: cookieHeader },
        cache: 'no-store',
      }),

    onboarding: (body: unknown, cookieHeader: string) =>
      patch(`${BACKEND}/api/user/profile/onboarding/`, body, cookieHeader),

    updateProfile: (body: unknown, cookieHeader: string) =>
      patch(`${BACKEND}/api/user/profile/update_profile/`, body, cookieHeader),

    changePassword: (body: unknown, cookieHeader: string) =>
      fetch(`${BACKEND}/api/user/profile/change-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify(body),
        cache: 'no-store',
      }),

    avatar: (body: FormData, cookieHeader: string) =>
      fetch(`${BACKEND}/api/user/profile/avatar/`, {
        method: 'PATCH',
        headers: { cookie: cookieHeader },
        body,
        cache: 'no-store',
      }),

    checkUsername: (username: string) =>
      fetch(
        `${BACKEND}/api/username-check/?username=${encodeURIComponent(username)}`,
        { cache: 'no-store' },
      ),

    invite: (cookieHeader: string) =>
      fetch(`${BACKEND}/api/user/invite/`, {
        method: 'POST',
        headers: { cookie: cookieHeader },
        cache: 'no-store',
      }),

    inviteDetails: (token: string) =>
      fetch(
        `${BACKEND}/api/user/invite/${encodeURIComponent(token)}/details/`,
        { cache: 'no-store' },
      ),

    inviteUse: (token: string, cookieHeader: string) =>
      fetch(`${BACKEND}/api/user/invite/use/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify({ token }),
        cache: 'no-store',
      }),

    events: (id: string, query: string, cookieHeader: string) =>
      fetch(
        `${BACKEND}/api/user/users/${id}/events/${query ? `?${query}` : ''}`,
        {
          headers: { cookie: cookieHeader },
          cache: 'no-store',
        },
      ),

    friendshipFriends: (query: string, cookieHeader: string) =>
      fetch(
        `${BACKEND}/api/user/friendship/friends/${query ? `?${query}` : ''}`,
        {
          headers: { cookie: cookieHeader },
          cache: 'no-store',
        },
      ),

    friendshipIncoming: (cookieHeader: string) =>
      fetch(`${BACKEND}/api/user/friendship/incoming/`, {
        headers: { cookie: cookieHeader },
        cache: 'no-store',
      }),

    friendshipAccept: (id: string, cookieHeader: string) =>
      fetch(`${BACKEND}/api/user/friendship/${id}/accept/`, {
        method: 'POST',
        headers: { cookie: cookieHeader },
        cache: 'no-store',
      }),

    friendshipDecline: (id: string, cookieHeader: string) =>
      fetch(`${BACKEND}/api/user/friendship/${id}/decline/`, {
        method: 'POST',
        headers: { cookie: cookieHeader },
        cache: 'no-store',
      }),

    friendshipRemove: (id: string, cookieHeader: string) =>
      fetch(`${BACKEND}/api/user/friendship/${id}/`, {
        method: 'DELETE',
        headers: { cookie: cookieHeader },
        cache: 'no-store',
      }),

    friendshipSend: (body: unknown, cookieHeader: string) =>
      fetch(`${BACKEND}/api/user/friendship/send/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify(body),
        cache: 'no-store',
      }),
  },

  event: {
    list: (query: string, cookieHeader: string) =>
      fetch(`${BACKEND}/api/event/events/${query ? `?${query}` : ''}`, {
        headers: { cookie: cookieHeader },
        cache: 'no-store',
      }),

    get: (id: string, cookieHeader: string) =>
      fetch(`${BACKEND}/api/event/events/${id}/`, {
        headers: { cookie: cookieHeader },
        cache: 'no-store',
      }),

    categories: () =>
      fetch(`${BACKEND}/api/event/category/`, { cache: 'no-store' }),

    action: (id: string, action: string, cookieHeader: string) =>
      fetch(`${BACKEND}/api/event/events/${id}/${action}/`, {
        method: 'POST',
        headers: { cookie: cookieHeader },
        cache: 'no-store',
      }),

    participants: (id: string, cookieHeader: string) =>
      fetch(`${BACKEND}/api/event/events/${id}/participants/`, {
        headers: { cookie: cookieHeader },
        cache: 'no-store',
      }),

    create: (
      type: 'plan' | 'wish',
      body: FormData | unknown,
      cookieHeader: string,
    ) => {
      const url = `${BACKEND}/api/event/events/create_${type}/`;

      if (body instanceof FormData) {
        return fetch(url, {
          method: 'POST',
          headers: { cookie: cookieHeader },
          body,
          cache: 'no-store',
        });
      }

      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify(body),
        cache: 'no-store',
      });
    },

    update: (
      id: string,
      type: 'plan' | 'wish',
      body: FormData | unknown,
      cookieHeader: string,
    ) => {
      const url = `${BACKEND}/api/event/events/${id}/update_${type}/`;

      if (body instanceof FormData) {
        return fetch(url, {
          method: 'PATCH',
          headers: { cookie: cookieHeader },
          body,
          cache: 'no-store',
        });
      }

      return patch(url, body, cookieHeader);
    },

    convert: (id: string, body: unknown, cookieHeader: string) =>
      fetch(`${BACKEND}/api/event/events/${id}/convert_to_plan/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify(body),
        cache: 'no-store',
      }),
  },

  notifications: {
    list: (cookieHeader: string) =>
      fetch(`${BACKEND}/api/notifications/?page_size=10`, {
        headers: { cookie: cookieHeader },
        cache: 'no-store',
      }),

    unreadCount: (cookieHeader: string) =>
      fetch(`${BACKEND}/api/notifications/unread_count/`, {
        headers: { cookie: cookieHeader },
        cache: 'no-store',
      }),

    readAll: (cookieHeader: string) =>
      fetch(`${BACKEND}/api/notifications/read_all/`, {
        method: 'POST',
        headers: { cookie: cookieHeader },
        cache: 'no-store',
      }),
  },
};
