// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type LandingProps = {
  token: string;
  username?: string;
  avatarSrc?: string | null;
};

const BACKEND = 'http://backend.test';

const mocks = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_BACKEND_URL = 'http://backend.test';

  return {
    inviteDetails: vi.fn(),
    inviteLanding: vi.fn(),
  };
});

vi.mock('@/app/_server/api/backend', () => ({
  beApi: { user: { inviteDetails: mocks.inviteDetails } },
}));

vi.mock('@/client_pages', () => ({
  InviteLanding: (props: LandingProps) => {
    mocks.inviteLanding(props);

    return <div data-testid="invite-landing">{props.username ?? 'anon'}</div>;
  },
}));

import Page from './page';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const renderPage = async (token: string) =>
  render(await Page({ params: Promise.resolve({ token }) }));

const landingProps = (): LandingProps =>
  mocks.inviteLanding.mock.calls.at(-1)![0];

describe('invite/[token] landing page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the inviter details for a valid token', async () => {
    mocks.inviteDetails.mockResolvedValue(
      jsonResponse({ sender_id: 4, username: 'bob', avatar: 'media/b.jpg' }),
    );

    await renderPage('tok-123');

    expect(mocks.inviteDetails).toHaveBeenCalledWith('tok-123');
    expect(landingProps()).toEqual({
      token: 'tok-123',
      username: 'bob',
      avatarSrc: `${BACKEND}/media/b.jpg`,
    });
    expect(screen.getByTestId('invite-landing').textContent).toBe('bob');
  });

  it.each([
    ['a relative path', 'media/b.jpg', `${BACKEND}/media/b.jpg`],
    ['a rooted path', '/media/b.jpg', `${BACKEND}/media/b.jpg`],
    ['a doubly rooted path', '//media/b.jpg', '//media/b.jpg'],
    ['an absolute url', 'https://cdn.test/b.jpg', 'https://cdn.test/b.jpg'],
    ['a null avatar', null, null],
    ['a blank avatar', '   ', null],
  ])('normalizes %s', async (_label, avatar, expected) => {
    mocks.inviteDetails.mockResolvedValue(
      jsonResponse({ sender_id: 4, username: 'bob', avatar }),
    );

    await renderPage('tok-123');

    expect(landingProps().avatarSrc).toBe(expected);
  });

  it.each([404, 410, 500])(
    'falls back to placeholders when the token lookup answers %s',
    async status => {
      mocks.inviteDetails.mockResolvedValue(jsonResponse({}, status));

      await renderPage('expired-token');

      expect(landingProps()).toEqual({
        token: 'expired-token',
        username: undefined,
        avatarSrc: undefined,
      });
      expect(screen.getByTestId('invite-landing').textContent).toBe('anon');
    },
  );

  it('keeps the placeholder state when the payload has no username', async () => {
    mocks.inviteDetails.mockResolvedValue(
      jsonResponse({ sender_id: 4, username: null, avatar: null }),
    );

    await renderPage('tok-123');

    expect(landingProps().username).toBeUndefined();
    expect(landingProps().avatarSrc).toBeNull();
  });

  it('passes the raw token through untouched so the lookup and the join link agree', async () => {
    mocks.inviteDetails.mockResolvedValue(jsonResponse({}, 404));

    await renderPage('a/b c#d');
    expect(mocks.inviteDetails).toHaveBeenCalledWith('a/b c#d');
    expect(landingProps().token).toBe('a/b c#d');
  });
});
