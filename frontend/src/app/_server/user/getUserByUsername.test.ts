import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: mocks.cookies,
}));

const BACKEND = 'http://backend.test';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const publicProfile = {
  user_id: 3,
  username: 'ann',
  avatar: null,
  bio: 'hi',
  is_private: false,
  friendship_status: 'friends' as const,
};

const loadModule = async () => {
  vi.resetModules();
  process.env.NEXT_PUBLIC_BACKEND_URL = BACKEND;

  return import('./getUserByUsername');
};

const fetchMock = vi.fn();

const setCookieStore = (value: string) =>
  mocks.cookies.mockResolvedValue({ toString: () => value });

const requestedUrl = () => fetchMock.mock.calls[0][0] as string;

describe('getUserByUsername', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('forwards session cookies and disables caching', async () => {
    setCookieStore('access_token=valid; theme=dark');
    fetchMock.mockResolvedValue(jsonResponse(publicProfile));

    const { getUserByUsername } = await loadModule();

    await expect(getUserByUsername('ann')).resolves.toEqual(publicProfile);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `${BACKEND}/api/user/profile/by-username/ann/`,
      expect.objectContaining({
        headers: { cookie: 'access_token=valid; theme=dark' },
        cache: 'no-store',
      }),
    );
  });

  it.each([
    ['a space', 'ann smith', 'ann%20smith'],
    ['a slash', 'a/b', 'a%2Fb'],
    ['a path traversal attempt', '../admin', '..%2Fadmin'],
    ['a query separator', 'ann?admin=1', 'ann%3Fadmin%3D1'],
    ['a hash', 'ann#top', 'ann%23top'],
    ['a unicode name', 'аня', '%D0%B0%D0%BD%D1%8F'],
  ])('encodes %s exactly once', async (_label, username, encoded) => {
    setCookieStore('');
    fetchMock.mockResolvedValue(jsonResponse(publicProfile));

    const { getUserByUsername } = await loadModule();

    await getUserByUsername(username);

    expect(requestedUrl()).toBe(
      `${BACKEND}/api/user/profile/by-username/${encoded}/`,
    );
  });

  it('does not double-encode a username that already contains a percent sign', async () => {
    setCookieStore('');
    fetchMock.mockResolvedValue(jsonResponse(publicProfile));

    const { getUserByUsername } = await loadModule();

    await getUserByUsername('100%');

    expect(requestedUrl()).toBe(
      `${BACKEND}/api/user/profile/by-username/100%25/`,
    );
    expect(decodeURIComponent(requestedUrl())).toContain('100%/');
  });

  it.each([400, 401, 403, 404, 500])(
    'returns null for a %s response so private and missing profiles look the same',
    async status => {
      setCookieStore('access_token=valid');
      fetchMock.mockResolvedValue(jsonResponse({ detail: 'nope' }, status));

      const { getUserByUsername } = await loadModule();

      await expect(getUserByUsername('ann')).resolves.toBeNull();
    },
  );

  it('propagates a network failure instead of hiding the outage as "not found"', async () => {
    setCookieStore('');
    fetchMock.mockRejectedValue(new Error('backend unreachable'));

    const { getUserByUsername } = await loadModule();

    await expect(getUserByUsername('ann')).rejects.toThrow(
      'backend unreachable',
    );
  });

  it('propagates malformed success JSON', async () => {
    setCookieStore('');
    fetchMock.mockResolvedValue(
      new Response('not json', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const { getUserByUsername } = await loadModule();

    await expect(getUserByUsername('ann')).rejects.toBeInstanceOf(Error);
  });
});
