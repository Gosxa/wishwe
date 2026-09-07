// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Profile } from '@/shared/client_api/auth/types';

const routerMocks = vi.hoisted(() => ({
  prefetch: vi.fn(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => routerMocks,
}));

vi.mock('@/shared/store/useUserStore', () => ({
  useUserStore: () => null,
}));

vi.mock('@shared/ui/icons', () => ({
  Pencil: () => <svg data-testid="pencil-icon" />,
  Sparkles: () => <svg data-testid="sparkles-icon" />,
}));

vi.mock('@shared/ui/avatarImage/AvatarImage', () => ({
  AvatarImage: ({ alt }: { alt: string }) => (
    <div data-testid="avatar">{alt}</div>
  ),
}));

vi.mock('./ProfileStats', () => ({
  ProfileStats: () => <div data-testid="profile-stats" />,
}));

vi.mock('./InviteFriends', () => ({
  InviteFriends: () => <div data-testid="invite-friends" />,
}));

import { ProfileHeader } from './ProfileHeader';

const profile: Profile = {
  avatar: 'https://cdn.test/avatar.png',
  bio: 'Active weekend adventurer',
  city: 'Warsaw',
  date_of_birth: '1995-05-10',
  first_name: 'Alex',
  gender: 'Other',
  has_seen_feed_tour: true,
  id: 1,
  is_private: false,
  last_name: 'River',
  social_media_url: 'https://instagram.com/alex',
  user: 'alex@example.com',
  user_id: 10,
  username: 'alex',
  active_events_count: 5,
  archived_events_count: 2,
};

describe('ProfileHeader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders identity, stats, and an Edit profile link', () => {
    render(<ProfileHeader initialUser={profile} />);

    expect(screen.getByRole('heading', { name: '@alex' })).toBeTruthy();
    expect(screen.getByText('Active weekend adventurer')).toBeTruthy();

    const link = screen.getByRole('link', { name: 'Edit profile' });

    expect(link.getAttribute('href')).toBe('/edit-profile');
    expect(link.getAttribute('aria-disabled')).toBe('false');
  });

  it('plays transition and navigates on edit click when standalone', () => {
    render(<ProfileHeader initialUser={profile} />);

    expect(routerMocks.prefetch).toHaveBeenCalledWith('/edit-profile');

    const link = screen.getByRole('link', { name: 'Edit profile' });

    fireEvent.click(link);

    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(routerMocks.push).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(320);
    });

    expect(routerMocks.push).toHaveBeenCalledWith('/edit-profile');
  });

  it('delegates click and leaving status to parent props if provided', () => {
    const onEditClick = vi.fn((e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
    });

    render(
      <ProfileHeader
        initialUser={profile}
        onEditClick={onEditClick}
        isLeaving={true}
      />,
    );

    const link = screen.getByRole('link', { name: 'Edit profile' });

    expect(link.getAttribute('aria-disabled')).toBe('true');

    fireEvent.click(link);
    expect(onEditClick).toHaveBeenCalledTimes(1);
  });
});
