// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PublicProfile } from '@/shared/client_api/user/types';

const mocks = vi.hoisted(() => ({
  getUserByUsername: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  userProfilePage: vi.fn(),
}));

vi.mock('@/app/_server/user/getUserByUsername', () => ({
  getUserByUsername: mocks.getUserByUsername,
}));

vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));

vi.mock('@/client_pages', () => ({
  UserProfilePage: ({ profile }: { profile: PublicProfile }) => {
    mocks.userProfilePage(profile);

    return <div data-testid="user-profile-page">{profile.username}</div>;
  },
}));

import Page from './page';

const publicProfile: PublicProfile = {
  user_id: 3,
  username: 'ann',
  avatar: null,
  bio: 'hi',
  is_private: false,
  friendship_status: 'none',
};

const renderPage = async (username: string) =>
  render(await Page({ params: Promise.resolve({ username }) }));

describe('(protected)/user/[username] page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('looks up the profile and renders it', async () => {
    mocks.getUserByUsername.mockResolvedValue(publicProfile);

    await renderPage('ann');

    expect(mocks.getUserByUsername).toHaveBeenCalledWith('ann');
    expect(mocks.userProfilePage).toHaveBeenCalledWith(publicProfile);
    expect(screen.getByTestId('user-profile-page').textContent).toBe('ann');
    expect(mocks.notFound).not.toHaveBeenCalled();
  });

  it.each([
    ['a percent-encoded space', 'ann%20smith', 'ann smith'],
    ['a percent-encoded unicode name', '%D0%B0%D0%BD%D1%8F', 'аня'],
    ['a percent-encoded slash', 'a%2Fb', 'a/b'],
  ])('decodes %s before the lookup', async (_label, param, expected) => {
    mocks.getUserByUsername.mockResolvedValue(publicProfile);

    await renderPage(param);

    expect(mocks.getUserByUsername).toHaveBeenCalledWith(expected);
  });

  it.each([['a missing profile'], ['a private profile']])(
    'renders the 404 page for %s',
    async () => {
      mocks.getUserByUsername.mockResolvedValue(null);

      await expect(renderPage('ghost')).rejects.toThrow('NEXT_NOT_FOUND');

      expect(mocks.notFound).toHaveBeenCalledTimes(1);
      expect(mocks.userProfilePage).not.toHaveBeenCalled();
    },
  );

  it('lets a backend outage surface instead of showing a misleading 404', async () => {
    mocks.getUserByUsername.mockRejectedValue(new Error('backend unreachable'));

    await expect(renderPage('ann')).rejects.toThrow('backend unreachable');

    expect(mocks.notFound).not.toHaveBeenCalled();
  });

  it('surfaces a malformed percent-escape in the URL as an error, not a lookup', async () => {
    await expect(renderPage('%')).rejects.toBeInstanceOf(URIError);

    expect(mocks.getUserByUsername).not.toHaveBeenCalled();
  });
});
