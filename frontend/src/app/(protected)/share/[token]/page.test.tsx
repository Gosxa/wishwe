// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SharedEventResult } from '@/app/_server/event/getSharedEvent';
import type { Profile } from '@/shared/client_api/auth/types';
import type {
  FriendshipStatus,
  PublicProfile,
} from '@/shared/client_api/user/types';

type SharedPageProps = {
  shared: SharedEventResult;
  isAuthenticated: boolean;
  loginHref: string;
  creatorFriendshipStatus: FriendshipStatus | null;
};

const mocks = vi.hoisted(() => ({
  authUser: vi.fn(),
  getSharedEvent: vi.fn(),
  getUserByUsername: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  sharedEventPage: vi.fn(),
}));

vi.mock('@/app/_server/auth/getMe', () => ({ authUser: mocks.authUser }));

vi.mock('@/app/_server/event/getSharedEvent', () => ({
  getSharedEvent: mocks.getSharedEvent,
}));

vi.mock('@/app/_server/user/getUserByUsername', () => ({
  getUserByUsername: mocks.getUserByUsername,
}));

vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

vi.mock('@/client_pages', () => ({
  SharedEventPage: (props: SharedPageProps) => {
    mocks.sharedEventPage(props);

    return <div data-testid="shared-event-page">{props.shared.status}</div>;
  },
}));

import Page, { metadata } from './page';

const profile: Profile = {
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
  has_seen_feed_tour: true,
};

const creator: PublicProfile = {
  user_id: 42,
  username: 'bob',
  avatar: null,
  bio: null,
  is_private: false,
  friendship_status: 'friends',
};

const okWithAccess = {
  status: 'ok' as const,
  data: { has_access: true, event: { id: 5 }, preview: null },
};

const okPreviewOnly = {
  status: 'ok' as const,
  data: {
    has_access: false,
    event: null,
    preview: { creator: { username: 'bob' } },
  },
};

const renderPage = async (token: string) =>
  render(await Page({ params: Promise.resolve({ token }) }));

const pageProps = (): SharedPageProps =>
  mocks.sharedEventPage.mock.calls.at(-1)![0];

describe('(protected)/share/[token] page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUserByUsername.mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
  });

  it('fetches with credentials and reports the visitor as authenticated', async () => {
    mocks.authUser.mockResolvedValue(profile);
    mocks.getSharedEvent.mockResolvedValue(okWithAccess);

    await renderPage('abc123');

    expect(mocks.getSharedEvent).toHaveBeenCalledWith('abc123', {
      includeCredentials: true,
    });
    expect(pageProps().isAuthenticated).toBe(true);
    expect(pageProps().shared).toEqual(okWithAccess);
    expect(screen.getByTestId('shared-event-page')).toBeDefined();
  });

  it('fetches without credentials for an anonymous visitor', async () => {
    mocks.authUser.mockResolvedValue(null);
    mocks.getSharedEvent.mockResolvedValue(okPreviewOnly);

    await renderPage('abc123');

    expect(mocks.getSharedEvent).toHaveBeenCalledWith('abc123', {
      includeCredentials: false,
    });
    expect(pageProps().isAuthenticated).toBe(false);
  });

  it('redirects an unauthorized visitor to onboarding with the share link as return path', async () => {
    mocks.authUser.mockResolvedValue(null);
    mocks.getSharedEvent.mockResolvedValue({ status: 'unauthorized' });

    await expect(renderPage('abc123')).rejects.toThrow('NEXT_REDIRECT');

    expect(mocks.redirect).toHaveBeenCalledWith(
      `/onboard?next=${encodeURIComponent('/share/abc123')}`,
    );
    expect(mocks.sharedEventPage).not.toHaveBeenCalled();
    expect(mocks.getUserByUsername).not.toHaveBeenCalled();
  });

  it('renders the not-found state instead of throwing', async () => {
    mocks.authUser.mockResolvedValue(profile);
    mocks.getSharedEvent.mockResolvedValue({ status: 'not-found' });

    await renderPage('missing');

    expect(pageProps().shared).toEqual({ status: 'not-found' });
    expect(screen.getByTestId('shared-event-page').textContent).toBe(
      'not-found',
    );
    expect(mocks.getUserByUsername).not.toHaveBeenCalled();
  });

  it('renders the private preview and resolves the creator friendship status', async () => {
    mocks.authUser.mockResolvedValue(profile);
    mocks.getSharedEvent.mockResolvedValue(okPreviewOnly);
    mocks.getUserByUsername.mockResolvedValue(creator);

    await renderPage('abc123');

    expect(mocks.getUserByUsername).toHaveBeenCalledWith('bob');
    expect(pageProps().creatorFriendshipStatus).toBe('friends');
  });

  it.each([['incoming_request'], ['requested'], ['none'], ['self']] as const)(
    'propagates the %s friendship status',
    async status => {
      mocks.authUser.mockResolvedValue(profile);
      mocks.getSharedEvent.mockResolvedValue(okPreviewOnly);
      mocks.getUserByUsername.mockResolvedValue({
        ...creator,
        friendship_status: status,
      });

      await renderPage('abc123');

      expect(pageProps().creatorFriendshipStatus).toBe(status);
    },
  );

  it('falls back to a null friendship status when the creator cannot be resolved', async () => {
    mocks.authUser.mockResolvedValue(profile);
    mocks.getSharedEvent.mockResolvedValue(okPreviewOnly);
    mocks.getUserByUsername.mockResolvedValue(null);

    await renderPage('abc123');

    expect(pageProps().creatorFriendshipStatus).toBeNull();
  });

  it('does not look up the creator for an anonymous visitor', async () => {
    mocks.authUser.mockResolvedValue(null);
    mocks.getSharedEvent.mockResolvedValue(okPreviewOnly);

    await renderPage('abc123');

    expect(mocks.getUserByUsername).not.toHaveBeenCalled();
    expect(pageProps().creatorFriendshipStatus).toBeNull();
  });

  it('does not look up the creator when the payload has no preview', async () => {
    mocks.authUser.mockResolvedValue(profile);
    mocks.getSharedEvent.mockResolvedValue(okWithAccess);

    await renderPage('abc123');

    expect(mocks.getUserByUsername).not.toHaveBeenCalled();
    expect(pageProps().creatorFriendshipStatus).toBeNull();
  });

  it.each([
    ['a path traversal token', '../../admin'],
    ['a query injection token', 'abc?next=//evil'],
    ['a token with a hash', 'abc#frag'],
    ['a token with a space', 'ab c'],
  ])('encodes %s inside the login return path', async (_label, token) => {
    mocks.authUser.mockResolvedValue(null);
    mocks.getSharedEvent.mockResolvedValue({ status: 'unauthorized' });

    await expect(renderPage(token)).rejects.toThrow('NEXT_REDIRECT');

    const [href] = mocks.redirect.mock.calls[0];
    const url = new URL(href, 'http://localhost');
    const next = url.searchParams.get('next');

    expect(url.pathname).toBe('/onboard');
    expect(next).toBe(`/share/${encodeURIComponent(token)}`);
    expect(new URL(next!, 'http://localhost').pathname).toBe(
      `/share/${encodeURIComponent(token)}`,
    );
  });

  it('passes the same login href to the rendered page for a visitor who may still sign in', async () => {
    mocks.authUser.mockResolvedValue(null);
    mocks.getSharedEvent.mockResolvedValue(okPreviewOnly);

    await renderPage('abc 123');

    expect(pageProps().loginHref).toBe(
      `/onboard?next=${encodeURIComponent('/share/abc%20123')}`,
    );
  });

  it('exposes share-friendly metadata', () => {
    expect(metadata.title).toBe('Shared event · WishWe');
    expect(metadata.openGraph?.title).toBe('You’re invited on WishWe');
    expect(metadata.twitter?.title).toBe('You’re invited on WishWe');
  });
});
