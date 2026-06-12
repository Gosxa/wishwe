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

    avatar: (body: FormData, cookieHeader: string) => {
      // In Node.js fetch, FormData doesn't auto-set Content-Type with boundary.
      // We need to get it from the FormData object itself.
      const headers: Record<string, string> = { cookie: cookieHeader };

      // Node 18+ / undici: FormData has no .getHeaders(), but we can cast
      // to get the boundary via the internal boundary property
      // The safest fix: convert FormData → Blob with explicit type
      return fetch(`${BACKEND}/api/user/profile/avatar/`, {
        method: 'PATCH',
        headers,
        body,
        cache: 'no-store',
        // @ts-ignore — undici supports duplex for streaming
        duplex: 'half',
      });
    },

    checkUsername: (username: string) =>
      fetch(
        `${BACKEND}/api/username-check/?username=${encodeURIComponent(username)}`,
        { cache: 'no-store' },
      ),
  },

  event: {
    list: (query: string, cookieHeader: string) =>
      fetch(`${BACKEND}/api/event/events/${query ? `?${query}` : ''}`, {
        headers: { cookie: cookieHeader },
        cache: 'no-store',
      }),

    action: (id: string, action: string, cookieHeader: string) =>
      fetch(`${BACKEND}/api/event/events/${id}/${action}/`, {
        method: 'POST',
        headers: { cookie: cookieHeader },
        cache: 'no-store',
      }),
  },
};
