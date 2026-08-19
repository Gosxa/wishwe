// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type InviteContext = {
  token: string;
  username?: string;
  avatar?: string | null;
};

type OnBoardProps = { invite?: InviteContext };

const BACKEND = 'http://backend.test';

const mocks = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_BACKEND_URL = 'http://backend.test';

  return {
    inviteDetails: vi.fn(),
    onBoard: vi.fn(),
  };
});

vi.mock('@/app/_server/api/backend', () => ({
  beApi: { user: { inviteDetails: mocks.inviteDetails } },
}));

vi.mock('@/client_pages', () => ({
  OnBoard: (props: OnBoardProps) => {
    mocks.onBoard(props);

    return <div data-testid="onboard">{props.invite?.username ?? 'anon'}</div>;
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

const invite = (): InviteContext => mocks.onBoard.mock.calls.at(-1)![0].invite;

describe('invite/[token]/join page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('starts onboarding with the inviter context for a valid token', async () => {
    mocks.inviteDetails.mockResolvedValue(
      jsonResponse({ sender_id: 4, username: 'bob', avatar: 'media/b.jpg' }),
    );

    await renderPage('tok-123');

    expect(mocks.inviteDetails).toHaveBeenCalledWith('tok-123');
    expect(invite()).toEqual({
      token: 'tok-123',
      username: 'bob',
      avatar: `${BACKEND}/media/b.jpg`,
    });
    expect(screen.getByTestId('onboard').textContent).toBe('bob');
  });

  it.each([
    ['a rooted path', '/media/b.jpg', `${BACKEND}/media/b.jpg`],
    ['an absolute url', 'https://cdn.test/b.jpg', 'https://cdn.test/b.jpg'],
    ['a data url', 'data:image/png;base64,AAA', 'data:image/png;base64,AAA'],
    ['a null avatar', null, null],
  ])('normalizes %s', async (_label, avatar, expected) => {
    mocks.inviteDetails.mockResolvedValue(
      jsonResponse({ sender_id: 4, username: 'bob', avatar }),
    );

    await renderPage('tok-123');

    expect(invite().avatar).toBe(expected);
  });

  it.each([404, 410, 500])(
    'still lets the visitor onboard when the token lookup answers %s',
    async status => {
      mocks.inviteDetails.mockResolvedValue(jsonResponse({}, status));

      await renderPage('expired-token');

      expect(invite()).toEqual({
        token: 'expired-token',
        username: undefined,
        avatar: undefined,
      });
      expect(screen.getByTestId('onboard')).toBeDefined();
    },
  );

  it('passes the raw token through untouched', async () => {
    mocks.inviteDetails.mockResolvedValue(jsonResponse({}, 404));

    await renderPage('a/b c#d');

    expect(mocks.inviteDetails).toHaveBeenCalledWith('a/b c#d');
    expect(invite().token).toBe('a/b c#d');
  });
});
