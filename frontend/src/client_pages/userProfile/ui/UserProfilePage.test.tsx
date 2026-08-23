// @vitest-environment jsdom

import type { ChangeEvent } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FeedEvent } from '@client_pages/home/model/types';
import type { PublicProfile } from '@/shared/client_api/user/types';

const mocks = vi.hoisted(() => ({
  events: [] as FeedEvent[],
  setSort: vi.fn(),
  setTab: vi.fn(),
  sort: 'recent' as 'recent' | 'soonest',
  tab: 'plans' as 'plans' | 'wishes' | 'archive',
  useProfileEvents: vi.fn(),
}));

vi.mock('@client_pages/profile/model/useProfileSearch', () => ({
  useProfileSearch: () => ({ onChange: vi.fn(), value: '' }),
}));

vi.mock('@client_pages/profile/model/useProfileToolbar', () => ({
  useProfileToolbar: () => ({
    setSort: mocks.setSort,
    setTab: mocks.setTab,
    sort: mocks.sort,
    tab: mocks.tab,
  }),
}));

vi.mock('@client_pages/profile/model/useProfileEvents', () => ({
  useProfileEvents: mocks.useProfileEvents,
}));

vi.mock('@widgets/header', () => ({
  Header: ({
    search,
  }: {
    search: {
      onChange: (value: string) => void;
      placeholder: string;
      value: string;
    };
  }) => (
    <input
      aria-label={search.placeholder}
      value={search.value}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        search.onChange(event.target.value)
      }
    />
  ),
}));

vi.mock('@/shared/store/useUserStore', () => ({
  useUserStore: (
    selector: (state: { user: { avatar: string | null } }) => unknown,
  ) => selector({ user: { avatar: null } }),
}));

vi.mock('./UserProfileFriendButton', () => ({
  UserProfileFriendButton: ({
    onStatusChange,
  }: {
    onStatusChange: (status: 'friends') => void;
  }) => (
    <button type="button" onClick={() => onStatusChange('friends')}>
      Become friends
    </button>
  ),
}));

vi.mock('@client_pages/home/widgets/feed/ui/EventCard', () => ({
  EventCard: ({ event }: { event: FeedEvent }) => (
    <article>{event.title}</article>
  ),
}));

import UserProfilePage from './UserProfilePage';

const event = {
  id: 'event-8',
  type: 'plan',
  image: '/event.jpg',
  title: 'Board games',
  host: { username: '@bob' },
  date: 'Saturday',
  startsAt: null,
  createdAt: 1,
  location: 'Home',
  chatLink: null,
  participantCount: 2,
  maxParticipants: 6,
  participants: [],
  userParticipationStatus: null,
} satisfies FeedEvent;

const profile = (overrides: Partial<PublicProfile> = {}): PublicProfile => ({
  user_id: 8,
  username: 'bob',
  avatar: null,
  bio: 'Say yes to more plans',
  is_private: true,
  friendship_status: 'none',
  ...overrides,
});

describe('UserProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.events = [];
    mocks.sort = 'recent';
    mocks.tab = 'plans';
    mocks.useProfileEvents.mockImplementation(
      ({ enabled }: { enabled: boolean }) => ({
        events: enabled ? mocks.events : [],
        hasMore: false,
        isLoading: false,
        isLoadingMore: false,
        loadMore: vi.fn(),
      }),
    );
  });

  afterEach(cleanup);

  it('updates feed visibility when the header changes friendship status', () => {
    mocks.events = [event];
    render(<UserProfilePage profile={profile()} />);

    expect(screen.getByRole('textbox', { name: 'Search events' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '@bob' })).toBeTruthy();
    expect(screen.getByText('Say yes to more plans')).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Friends-only profile' }),
    ).toBeTruthy();
    expect(mocks.useProfileEvents).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: false, userId: 8 }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Become friends' }));

    expect(screen.queryByText('Friends-only profile')).toBeNull();
    expect(screen.getByRole('article').textContent).toBe('Board games');
    expect(mocks.useProfileEvents).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: true, userId: 8 }),
    );
  });

  it('shows the selected empty state and wires profile toolbar changes', () => {
    mocks.tab = 'wishes';
    render(
      <UserProfilePage profile={profile({ friendship_status: 'friends' })} />,
    );

    expect(screen.getByRole('heading', { name: 'No wishes yet' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    expect(mocks.setTab).toHaveBeenCalledWith('archive');
  });

  it('updates friendship status and feed when profile prop changes', () => {
    mocks.events = [event];
    const { rerender } = render(<UserProfilePage profile={profile()} />);

    expect(
      screen.getByRole('heading', { name: 'Friends-only profile' }),
    ).toBeTruthy();

    rerender(
      <UserProfilePage profile={profile({ friendship_status: 'friends' })} />,
    );

    expect(screen.queryByText('Friends-only profile')).toBeNull();
    expect(screen.getByRole('article').textContent).toBe('Board games');
  });
});
