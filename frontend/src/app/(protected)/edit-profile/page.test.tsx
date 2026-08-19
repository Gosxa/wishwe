// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Profile } from '@/shared/client_api/auth/types';

const mocks = vi.hoisted(() => ({
  authUser: vi.fn(),
  editProfilePage: vi.fn(),
}));

vi.mock('@/app/_server/auth/getMe', () => ({ authUser: mocks.authUser }));

vi.mock('@/client_pages', () => ({
  EditProfilePage: ({ initialUser }: { initialUser: Profile | null }) => {
    mocks.editProfilePage(initialUser);

    return <div data-testid="edit-profile-page">{initialUser?.bio ?? '—'}</div>;
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
  bio: 'hi there',
  date_of_birth: '1995-04-02',
  city: 'Kyiv',
  gender: 'Female',
  avatar: 'media/a.jpg',
  social_media_url: 'https://example.com/ann',
  is_private: false,
  has_seen_feed_tour: true,
};

describe('(protected)/edit-profile page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('seeds the form with every field of the authenticated profile', async () => {
    mocks.authUser.mockResolvedValue(profile);

    render(await Page());

    expect(mocks.editProfilePage).toHaveBeenCalledWith(profile);
    expect(screen.getByTestId('edit-profile-page').textContent).toBe(
      'hi there',
    );
  });

  it('renders with a null user rather than crashing when the session is gone', async () => {
    mocks.authUser.mockResolvedValue(null);

    render(await Page());

    expect(mocks.editProfilePage).toHaveBeenCalledWith(null);
    expect(screen.getByTestId('edit-profile-page')).toBeDefined();
  });
});
