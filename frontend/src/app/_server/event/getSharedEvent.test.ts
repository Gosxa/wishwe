import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  headers: vi.fn(),
  shared: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: mocks.cookies,
  headers: mocks.headers,
}));

vi.mock('@/app/_server/api/backend', () => ({
  beApi: { event: { shared: mocks.shared } },
}));

import { getSharedEvent } from './getSharedEvent';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

describe('getSharedEvent', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('prefers the forwarded cookie header after middleware refresh', async () => {
    mocks.headers.mockResolvedValue(
      new Headers({
        cookie: 'access_token=refreshed; refresh_token=valid',
      }),
    );
    mocks.cookies.mockResolvedValue({
      toString: () => 'access_token=expired; refresh_token=valid',
    });
    mocks.shared.mockResolvedValue(
      jsonResponse({ has_access: true, event: {}, preview: null }),
    );

    await expect(
      getSharedEvent('share-token', { includeCredentials: true }),
    ).resolves.toMatchObject({ status: 'ok' });

    expect(mocks.shared).toHaveBeenCalledWith(
      'share-token',
      'access_token=refreshed; refresh_token=valid',
    );
    expect(mocks.cookies).not.toHaveBeenCalled();
  });

  it('falls back to the cookie store without a forwarded cookie header', async () => {
    mocks.headers.mockResolvedValue(new Headers());
    mocks.cookies.mockResolvedValue({
      toString: () => 'access_token=valid; theme=dark',
    });
    mocks.shared.mockResolvedValue(
      jsonResponse({ has_access: true, event: {}, preview: null }),
    );

    await expect(
      getSharedEvent('share-token', { includeCredentials: true }),
    ).resolves.toMatchObject({ status: 'ok' });

    expect(mocks.shared).toHaveBeenCalledWith(
      'share-token',
      'access_token=valid; theme=dark',
    );
  });

  it('does not read or forward a stale access token for an anonymous visitor', async () => {
    mocks.shared.mockResolvedValue(
      jsonResponse({ has_access: false, event: null, preview: {} }),
    );

    await expect(
      getSharedEvent('share-token', { includeCredentials: false }),
    ).resolves.toMatchObject({ status: 'ok' });

    expect(mocks.cookies).not.toHaveBeenCalled();
    expect(mocks.headers).not.toHaveBeenCalled();
    expect(mocks.shared).toHaveBeenCalledWith('share-token', undefined);
  });

  it('keeps unauthorized distinct from a missing share link', async () => {
    mocks.headers.mockResolvedValue(new Headers());
    mocks.cookies.mockResolvedValue({ toString: () => 'access_token=invalid' });
    mocks.shared.mockResolvedValue(new Response(null, { status: 401 }));

    await expect(
      getSharedEvent('share-token', { includeCredentials: true }),
    ).resolves.toEqual({ status: 'unauthorized' });
  });
});
