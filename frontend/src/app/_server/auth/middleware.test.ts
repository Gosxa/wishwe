import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const backendMocks = vi.hoisted(() => ({
  me: vi.fn(),
  refreshToken: vi.fn(),
}));

vi.mock('@/app/_server/api/backend', () => ({
  beApi: {
    auth: { refreshToken: backendMocks.refreshToken },
    user: { me: backendMocks.me },
  },
}));

import { authMiddleware } from './middleware';

const ORIGIN = 'https://wishwe.test';

const makeRequest = (
  path: string,
  options: { cookie?: string; headers?: HeadersInit } = {},
) => {
  const headers = new Headers(options.headers);

  if (options.cookie) headers.set('cookie', options.cookie);

  return new NextRequest(`${ORIGIN}${path}`, { headers });
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const refreshResponse = (setCookies: string[], status = 200) => {
  const headers = new Headers();

  setCookies.forEach(cookie => headers.append('set-cookie', cookie));

  return new Response(null, { status, headers });
};

const forwardedHeader = (response: Response, name: string) =>
  response.headers.get(`x-middleware-request-${name}`);

describe('authMiddleware', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('without a refresh token', () => {
    it('redirects a protected page to onboarding with the complete return path', async () => {
      const response = await authMiddleware(
        makeRequest('/profile/alice?filter=wishes&sort=soonest'),
      );

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        `${ORIGIN}/onboard?next=%2Fprofile%2Falice%3Ffilter%3Dwishes%26sort%3Dsoonest`,
      );
      expect(backendMocks.me).not.toHaveBeenCalled();
      expect(backendMocks.refreshToken).not.toHaveBeenCalled();
    });

    it.each([
      ['an API path', '/api/events', {}],
      ['a JSON accept header', '/feed', { accept: 'application/json' }],
      ['a CORS fetch', '/feed', { 'sec-fetch-mode': 'cors' }],
      ['an empty-destination fetch', '/feed', { 'sec-fetch-dest': 'empty' }],
    ])('returns JSON 401 for %s', async (_label, path, headers) => {
      const response = await authMiddleware(makeRequest(path, { headers }));

      expect(response.status).toBe(401);
      expect(response.headers.get('content-type')).toContain(
        'application/json',
      );
      await expect(response.json()).resolves.toEqual({
        detail: 'Authentication required',
      });
    });

    it.each(['rsc', 'next-router-state-tree'])(
      'treats a soft navigation carrying %s as a page load',
      async navigationHeader => {
        const response = await authMiddleware(
          makeRequest('/profile?tab=plans', {
            headers: {
              accept: 'application/json',
              [navigationHeader]: '1',
              'sec-fetch-dest': 'empty',
            },
          }),
        );

        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe(
          `${ORIGIN}/onboard?next=%2Fprofile%3Ftab%3Dplans`,
        );
      },
    );

    it('allows the public root and removes untrusted internal headers', async () => {
      const response = await authMiddleware(
        makeRequest('/', {
          headers: {
            'x-pathname': '/forged-path',
            'x-user-id': '999',
          },
        }),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('x-middleware-next')).toBe('1');
      expect(forwardedHeader(response, 'x-pathname')).toBe('/');
      expect(forwardedHeader(response, 'x-user-id')).toBeNull();
    });

    it('allows a shared event preview and preserves its return path', async () => {
      const response = await authMiddleware(
        makeRequest('/share/89d16b0f-6f08-47db-8bc2-76cc45cd505b'),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('x-middleware-next')).toBe('1');
      expect(forwardedHeader(response, 'x-pathname')).toBe(
        '/share/89d16b0f-6f08-47db-8bc2-76cc45cd505b',
      );
      expect(forwardedHeader(response, 'x-user-id')).toBeNull();
      expect(backendMocks.me).not.toHaveBeenCalled();
      expect(backendMocks.refreshToken).not.toHaveBeenCalled();
    });
  });

  describe('with a valid access token', () => {
    it('accepts a valid access token when the refresh cookie is absent', async () => {
      backendMocks.me.mockResolvedValue(jsonResponse({ user_id: 42 }));

      const response = await authMiddleware(
        makeRequest('/feed', { cookie: 'access_token=still-valid' }),
      );

      expect(response.status).toBe(200);
      expect(backendMocks.me).toHaveBeenCalledWith('access_token=still-valid');
      expect(backendMocks.refreshToken).not.toHaveBeenCalled();
      expect(forwardedHeader(response, 'x-user-id')).toBe('42');
    });

    it('forwards the request path and authenticated user id without refreshing', async () => {
      const cookie =
        'access_token=valid-access; refresh_token=valid-refresh; theme=dark';

      backendMocks.me.mockResolvedValue(jsonResponse({ user_id: 42 }));

      const response = await authMiddleware(
        makeRequest('/feed?view=friends', {
          cookie,
          headers: {
            'x-pathname': '/forged-path',
            'x-user-id': '999',
          },
        }),
      );

      expect(response.status).toBe(200);
      expect(backendMocks.me).toHaveBeenCalledOnce();
      expect(backendMocks.me).toHaveBeenCalledWith(cookie);
      expect(backendMocks.refreshToken).not.toHaveBeenCalled();
      expect(forwardedHeader(response, 'cookie')).toBe(cookie);
      expect(forwardedHeader(response, 'x-pathname')).toBe(
        '/feed?view=friends',
      );
      expect(forwardedHeader(response, 'x-user-id')).toBe('42');
    });

    it('still authenticates when the profile response has no usable user id', async () => {
      backendMocks.me.mockResolvedValue(jsonResponse({ user_id: '42' }));

      const response = await authMiddleware(
        makeRequest('/feed', {
          cookie: 'access_token=valid; refresh_token=valid',
          headers: { 'x-user-id': '999' },
        }),
      );

      expect(response.status).toBe(200);
      expect(forwardedHeader(response, 'x-user-id')).toBeNull();
      expect(backendMocks.refreshToken).not.toHaveBeenCalled();
    });

    it('redirects an authenticated root request to the feed', async () => {
      backendMocks.me.mockResolvedValue(jsonResponse({ user_id: 7 }));

      const response = await authMiddleware(
        makeRequest('/', {
          cookie: 'access_token=valid; refresh_token=valid',
        }),
      );

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(`${ORIGIN}/feed`);
      expect(backendMocks.refreshToken).not.toHaveBeenCalled();
    });

    it('keeps an authenticated user on a shared event', async () => {
      backendMocks.me.mockResolvedValue(jsonResponse({ user_id: 7 }));

      const response = await authMiddleware(
        makeRequest('/share/event-token', {
          cookie: 'access_token=valid; refresh_token=valid',
        }),
      );

      expect(response.status).toBe(200);
      expect(forwardedHeader(response, 'x-user-id')).toBe('7');
      expect(forwardedHeader(response, 'x-pathname')).toBe(
        '/share/event-token',
      );
    });
  });

  describe('token refresh', () => {
    it('rotates cookies, retries authentication, and propagates the result', async () => {
      const originalCookie =
        'access_token=expired; refresh_token=old-refresh; theme=dark';
      const accessCookie =
        'access_token=new.access=value; Path=/; HttpOnly; SameSite=Lax';
      const refreshCookie =
        'refresh_token=new-refresh; Path=/; Expires=Wed, 21 Oct 2037 07:28:00 GMT; HttpOnly';
      const updatedCookie =
        'access_token=new.access=value; refresh_token=new-refresh; theme=dark';

      backendMocks.me
        .mockResolvedValueOnce(jsonResponse({ detail: 'expired' }, 401))
        .mockResolvedValueOnce(jsonResponse({ user_id: 84 }));
      backendMocks.refreshToken.mockResolvedValue(
        refreshResponse([accessCookie, refreshCookie]),
      );

      const response = await authMiddleware(
        makeRequest('/profile/bob?filter=archive', { cookie: originalCookie }),
      );

      expect(backendMocks.me).toHaveBeenNthCalledWith(1, originalCookie);
      expect(backendMocks.refreshToken).toHaveBeenCalledOnce();
      expect(backendMocks.refreshToken).toHaveBeenCalledWith(originalCookie);
      expect(backendMocks.me).toHaveBeenNthCalledWith(2, updatedCookie);
      expect(forwardedHeader(response, 'cookie')).toBe(updatedCookie);
      expect(forwardedHeader(response, 'x-pathname')).toBe(
        '/profile/bob?filter=archive',
      );
      expect(forwardedHeader(response, 'x-user-id')).toBe('84');
      expect(response.headers.getSetCookie()).toEqual([
        accessCookie,
        refreshCookie,
      ]);
    });

    it('refreshes directly when only a refresh token is present', async () => {
      backendMocks.refreshToken.mockResolvedValue(
        refreshResponse(['access_token=new-access; Path=/; HttpOnly']),
      );
      backendMocks.me.mockResolvedValue(jsonResponse({ user_id: 12 }));

      const response = await authMiddleware(
        makeRequest('/feed', {
          cookie: 'refresh_token=refresh-only; locale=uk',
        }),
      );

      expect(backendMocks.refreshToken).toHaveBeenCalledWith(
        'refresh_token=refresh-only; locale=uk',
      );
      expect(backendMocks.me).toHaveBeenCalledOnce();
      expect(backendMocks.me).toHaveBeenCalledWith(
        'refresh_token=refresh-only; locale=uk; access_token=new-access',
      );
      expect(response.status).toBe(200);
      expect(forwardedHeader(response, 'x-user-id')).toBe('12');
    });

    it('recovers from a failed access-token network request by refreshing', async () => {
      backendMocks.me
        .mockRejectedValueOnce(new Error('backend unavailable'))
        .mockResolvedValueOnce(jsonResponse({ user_id: 5 }));
      backendMocks.refreshToken.mockResolvedValue(
        refreshResponse(['access_token=recovered; Path=/']),
      );

      const response = await authMiddleware(
        makeRequest('/feed', {
          cookie: 'access_token=old; refresh_token=refresh',
        }),
      );

      expect(response.status).toBe(200);
      expect(backendMocks.refreshToken).toHaveBeenCalledOnce();
      expect(backendMocks.me).toHaveBeenCalledTimes(2);
    });

    it('preserves rotated cookies when a refreshed root request redirects', async () => {
      const rotatedCookie = 'access_token=new; Path=/; HttpOnly';

      backendMocks.refreshToken.mockResolvedValue(
        refreshResponse([rotatedCookie]),
      );
      backendMocks.me.mockResolvedValue(jsonResponse({ user_id: 1 }));

      const response = await authMiddleware(
        makeRequest('/', { cookie: 'refresh_token=refresh' }),
      );

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(`${ORIGIN}/feed`);
      expect(response.headers.getSetCookie()).toEqual([rotatedCookie]);
    });

    it.each([
      ['the refresh call throws', () => Promise.reject(new Error('offline'))],
      ['the refresh is rejected', () => refreshResponse([], 401)],
      ['the refresh returns no cookies', () => refreshResponse([])],
    ])('rejects the request when %s', async (_label, refreshResult) => {
      backendMocks.me.mockResolvedValue(jsonResponse({}, 401));
      backendMocks.refreshToken.mockImplementation(refreshResult);

      const response = await authMiddleware(
        makeRequest('/feed', {
          cookie: 'access_token=expired; refresh_token=invalid',
        }),
      );

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        `${ORIGIN}/onboard?next=%2Ffeed`,
      );
      expect(backendMocks.me).toHaveBeenCalledOnce();
    });

    it('falls back to an anonymous shared preview when refresh fails', async () => {
      backendMocks.me.mockResolvedValue(jsonResponse({}, 401));
      backendMocks.refreshToken.mockResolvedValue(refreshResponse([], 401));

      const response = await authMiddleware(
        makeRequest('/share/event-token', {
          cookie: 'access_token=expired; refresh_token=invalid',
        }),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('x-middleware-next')).toBe('1');
      expect(forwardedHeader(response, 'x-user-id')).toBeNull();
      expect(forwardedHeader(response, 'x-pathname')).toBe(
        '/share/event-token',
      );
    });

    it.each([
      ['is rejected', () => Promise.resolve(jsonResponse({}, 401))],
      ['throws', () => Promise.reject(new Error('offline'))],
    ])(
      'rejects the request when the post-refresh profile retry %s',
      async (_label, retryResult) => {
        backendMocks.refreshToken.mockResolvedValue(
          refreshResponse(['access_token=new; Path=/']),
        );
        backendMocks.me.mockImplementation(retryResult);

        const response = await authMiddleware(
          makeRequest('/feed', { cookie: 'refresh_token=refresh' }),
        );

        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe(
          `${ORIGIN}/onboard?next=%2Ffeed`,
        );
        expect(backendMocks.me).toHaveBeenCalledOnce();
      },
    );
  });
});
