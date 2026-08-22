// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FeedEvent } from '@client_pages/home/model/types';

const mocks = vi.hoisted(() => ({
  clearEventParam: vi.fn(),
  copyInvite: vi.fn(),
  events: [] as FeedEvent[],
  filter: 'all' as 'all' | 'plans' | 'wishes',
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  loadMore: vi.fn(),
  openCreate: vi.fn(),
  openEventId: null as string | null,
  reach: 'all' as 'all' | 'direct',
  search: '',
  setEventParam: vi.fn(),
  setFilter: vi.fn(),
  setReach: vi.fn(),
  setSort: vi.fn(),
  showDeepLinkCard: false,
  sort: 'soonest' as 'soonest' | 'recent' | 'heat',
  syncSearchDisabled: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'title' ? mocks.search : null),
  }),
}));

vi.mock('@client_pages/home/model/useFeedToolbar', () => ({
  useFeedToolbar: () => ({
    filter: mocks.filter,
    reach: mocks.reach,
    sort: mocks.sort,
    setFilter: mocks.setFilter,
    setReach: mocks.setReach,
    setSort: mocks.setSort,
  }),
}));

vi.mock('@client_pages/home/model/useFeedEvents', () => ({
  useFeedEvents: () => ({
    events: mocks.events,
    hasMore: mocks.hasMore,
    isLoading: mocks.isLoading,
    isLoadingMore: mocks.isLoadingMore,
    loadMore: mocks.loadMore,
  }),
}));

vi.mock('@shared/hooks/useEventDeepLink', () => ({
  useEventDeepLink: () => ({
    clearEventParam: mocks.clearEventParam,
    openEventId: mocks.openEventId,
    setEventParam: mocks.setEventParam,
    showDeepLinkCard: mocks.showDeepLinkCard,
  }),
}));

vi.mock('@shared/hooks/useSearchDisabledSync', () => ({
  useSearchDisabledSync: mocks.syncSearchDisabled,
}));

vi.mock('@shared/hooks/useInviteLink', () => ({
  useInviteLink: () => ({ copy: mocks.copyInvite, status: 'idle' }),
}));

vi.mock('@/shared/store/useCreateEventStore', () => ({
  useCreateEventStore: (
    selector: (state: { open: (type: 'plan' | 'wish') => void }) => unknown,
  ) => selector({ open: mocks.openCreate }),
}));

vi.mock('./DeepLinkCard', () => ({
  DeepLinkCard: ({
    eventId,
    onClose,
  }: {
    eventId: string;
    onClose: () => void;
  }) => (
    <aside aria-label={`Deep-linked event ${eventId}`}>
      <button type="button" onClick={onClose}>
        Close deep link
      </button>
    </aside>
  ),
}));

vi.mock('./EventCard', () => ({
  EventCard: ({
    event,
    onDetailsOpen,
    tourId,
  }: {
    event: FeedEvent;
    onDetailsOpen: () => void;
    tourId?: string;
  }) => (
    <article data-tour={tourId}>
      <span>{event.title}</span>
      <button type="button" onClick={onDetailsOpen}>
        Open details
      </button>
    </article>
  ),
}));

import { Feed } from './Feed';

const event = {
  id: 'event-1',
  type: 'plan',
  image: '/event.jpg',
  title: 'Friday dinner',
  host: { username: '@alice' },
  date: 'Friday',
  startsAt: null,
  createdAt: 1,
  location: 'Downtown',
  chatLink: null,
  participantCount: 2,
  maxParticipants: 6,
  participants: [],
  userParticipationStatus: null,
} satisfies FeedEvent;

describe('Feed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.events = [];
    mocks.filter = 'all';
    mocks.hasMore = false;
    mocks.isLoading = false;
    mocks.isLoadingMore = false;
    mocks.openEventId = null;
    mocks.reach = 'all';
    mocks.search = '';
    mocks.showDeepLinkCard = false;
    mocks.sort = 'soonest';
  });

  afterEach(cleanup);

  it('renders the empty feed and wires filtering, invitations, and creation', () => {
    const onSearchDisabledChange = vi.fn();

    render(<Feed onSearchDisabledChange={onSearchDisabledChange} />);

    expect(
      screen.getByRole('heading', { name: 'Waiting for adventures?' }),
    ).toBeTruthy();
    expect(mocks.syncSearchDisabled).toHaveBeenCalledWith(
      onSearchDisabledChange,
      [],
      '',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Plans' }));
    expect(mocks.setFilter).toHaveBeenCalledWith('plans');

    fireEvent.click(screen.getByRole('button', { name: /Show:/ }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Only direct friends' }),
    );
    expect(mocks.setReach).toHaveBeenCalledWith('direct');

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(mocks.openCreate).toHaveBeenCalledWith('plan');

    fireEvent.click(screen.getByRole('button', { name: 'Invite friends' }));
    expect(mocks.copyInvite).toHaveBeenCalledTimes(1);
  });

  it('offers wish creation and social-heat sorting for a filtered feed', () => {
    mocks.filter = 'wishes';
    mocks.sort = 'recent';

    render(<Feed />);

    expect(screen.getByRole('heading', { name: 'No wishes yet' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Create a wish' }));
    expect(mocks.openCreate).toHaveBeenCalledWith('wish');

    fireEvent.click(screen.getByRole('button', { name: /Sort:/ }));
    fireEvent.click(screen.getByRole('button', { name: 'social heat' }));
    expect(mocks.setSort).toHaveBeenCalledWith('heat');
  });

  it('connects event cards and a URL deep link to their navigation callbacks', () => {
    mocks.events = [event];
    mocks.openEventId = event.id;
    mocks.search = 'dinner';
    mocks.showDeepLinkCard = true;

    render(<Feed />);

    expect(screen.getByText('Friday dinner')).toBeTruthy();
    expect(screen.getByRole('article').dataset.tour).toBe('feed-card');
    expect(
      screen.getByRole('complementary', {
        name: 'Deep-linked event event-1',
      }),
    ).toBeTruthy();
    expect(mocks.syncSearchDisabled).toHaveBeenCalledWith(
      undefined,
      [event],
      'dinner',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open details' }));
    expect(mocks.setEventParam).toHaveBeenCalledWith('event-1');

    fireEvent.click(screen.getByRole('button', { name: 'Close deep link' }));
    expect(mocks.clearEventParam).toHaveBeenCalledTimes(1);
  });
});
