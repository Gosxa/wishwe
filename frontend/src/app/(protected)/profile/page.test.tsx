// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Profile } from '@/shared/client_api/auth/types';

const mocks = vi.hoisted(() => ({
  authUser: vi.fn(),
  profilePage: vi.fn(),
}));

vi.mock('@/app/_server/auth/getMe', () => ({ authUser: mocks.authUser }));

vi.mock('@/client_pages', () => ({
  ProfilePage: ({ initialUser }: { initialUser: Profile | null }) => {
    mocks.profilePage(initialUser);

    return <div data-testid="profile-page">{initialUser?.username ?? '—'}</div>;
  },
}));

import Page from './page';

const profile: Profile = {
  id: 1,
  user: 'ann@example.com',
  user_id: 7,
  username: 'ann',
  first_name: 'Ann',
  last_name: 'Lee',
  bio: 'hi',
  date_of_birth: '1995-04-02',
  city: 'Kyiv',
  gender: 'Female',
  avatar: 'media/a.jpg',
  social_media_url: null,
  is_private: true,
  has_seen_feed_tour: true,
};

describe('(protected)/profile page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('hands the authenticated profile to the client page unchanged', async () => {
    mocks.authUser.mockResolvedValue(profile);

    render(await Page());

    expect(mocks.profilePage).toHaveBeenCalledWith(profile);
    expect(screen.getByTestId('profile-page').textContent).toBe('ann');
  });

  it('renders with a null user rather than crashing when the session is gone', async () => {
    mocks.authUser.mockResolvedValue(null);

    render(await Page());

    expect(mocks.profilePage).toHaveBeenCalledWith(null);
    expect(screen.getByTestId('profile-page')).toBeDefined();
  });
});
