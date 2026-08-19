import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { USER_ID_HEADER } from '@/shared/lib/nextPath';

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: mocks.cookies,
  headers: mocks.headers,
}));

const BACKEND = 'http://backend.test';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const profile = {
  id: 1,
  user: 'ann@example.com',
  user_id: 7,
  username: 'ann',
  first_name: 'Ann',
  last_name: null,
  bio: null,
  date_of_birth: null,
  city: null,
  gender: null,
  avatar: null,
  social_media_url: null,
  is_private: false,
  has_seen_feed_tour: false,
};

const loadGetMe = async () => {
  vi.resetModules();
  process.env.NEXT_PUBLIC_BACKEND_URL = BACKEND;

  return import('./getMe');
};

const fetchMock = vi.fn();

const setHeaders = (init?: HeadersInit) =>
  mocks.headers.mockResolvedValue(new Headers(init));

const setCookieStore = (value: string) =>
  mocks.cookies.mockResolvedValue({ toString: () => value });

describe('authUser', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the profile endpoint with the forwarded cookie header and no cache', async () => {
    setHeaders({ cookie: 'access_token=refreshed' });
    setCookieStore('access_token=expired');
    fetchMock.mockResolvedValue(jsonResponse(profile));

    const { authUser } = await loadGetMe();

    await expect(authUser()).resolves.toEqual(profile);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `${BACKEND}/api/user/profile/me/`,
      expect.objectContaining({
        headers: { cookie: 'access_token=refreshed' },
        cache: 'no-store',
      }),
    );
  });

  it('falls back to the Next cookie store when no cookie header was forwarded', async () => {
    setHeaders();
    setCookieStore('access_token=valid; theme=dark');
    fetchMock.mockResolvedValue(jsonResponse(profile));

    const { authUser } = await loadGetMe();

    await authUser();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { cookie: 'access_token=valid; theme=dark' },
      }),
    );
  });

  it('sends an empty cookie header when neither source has cookies', async () => {
    setHeaders();
    setCookieStore('');
    fetchMock.mockResolvedValue(jsonResponse(profile));

    const { authUser } = await loadGetMe();

    await authUser();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: { cookie: '' } }),
    );
  });

  it.each([401, 403, 404, 500])(
    'returns null for a %s response instead of leaking an error',
    async status => {
      setHeaders({ cookie: 'access_token=stale' });
      setCookieStore('');
      fetchMock.mockResolvedValue(jsonResponse({ detail: 'nope' }, status));

      const { authUser } = await loadGetMe();

      await expect(authUser()).resolves.toBeNull();
    },
  );

  it('propagates a network failure so the page fails loudly instead of rendering as anonymous', async () => {
    setHeaders({ cookie: 'access_token=valid' });
    setCookieStore('');
    fetchMock.mockRejectedValue(new Error('backend unreachable'));

    const { authUser } = await loadGetMe();

    await expect(authUser()).rejects.toThrow('backend unreachable');
  });

  it('propagates malformed success JSON rather than returning a broken profile', async () => {
    setHeaders({ cookie: 'access_token=valid' });
    setCookieStore('');
    fetchMock.mockResolvedValue(
      new Response('not json', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const { authUser } = await loadGetMe();

    await expect(authUser()).rejects.toBeInstanceOf(Error);
  });
});

describe('authUserId', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it.each([
    ['1', 1],
    ['42', 42],
    ['9007199254740991', 9007199254740991],
  ])('accepts the positive integer id %s', async (raw, expected) => {
    setHeaders({ [USER_ID_HEADER]: raw });

    const { authUserId } = await loadGetMe();

    await expect(authUserId()).resolves.toBe(expected);
  });

  it.each([
    ['a missing header', undefined],
    ['an empty header', ''],
    ['zero', '0'],
    ['a negative id', '-3'],
    ['a decimal id', '1.5'],
    ['a non-numeric id', 'abc'],
    ['a spoofed list of ids', '1,2'],
  ])('rejects %s', async (_label, raw) => {
    setHeaders(raw === undefined ? undefined : { [USER_ID_HEADER]: raw });

    const { authUserId } = await loadGetMe();

    await expect(authUserId()).resolves.toBeNull();
  });

  it('reads the id from the middleware header only, never from cookies', async () => {
    setHeaders({ [USER_ID_HEADER]: '12' });
    setCookieStore('x-user-id=99');

    const { authUserId } = await loadGetMe();

    await expect(authUserId()).resolves.toBe(12);
    expect(mocks.cookies).not.toHaveBeenCalled();
  });
});
