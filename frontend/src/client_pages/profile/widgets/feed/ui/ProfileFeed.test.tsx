// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FeedEvent } from '@client_pages/home/model/types';

const mocks = vi.hoisted(() => ({
  error: null as string | null,
  events: [] as FeedEvent[],
  retry: vi.fn(),
  setSort: vi.fn(),
  setTab: vi.fn(),
  sort: 'recent' as 'recent' | 'soonest',
  tab: 'plans' as 'plans' | 'wishes' | 'archive',
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
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
  useProfileEvents: () => ({
    error: mocks.error,
    events: mocks.events,
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
    loadMore: vi.fn(),
    retry: mocks.retry,
  }),
}));

vi.mock('@shared/hooks/useEventDeepLink', () => ({
  useEventDeepLink: () => ({
    clearEventParam: vi.fn(),
    openEventId: null,
    setEventParam: vi.fn(),
    showDeepLinkCard: false,
  }),
}));

vi.mock('@shared/hooks/useSearchDisabledSync', () => ({
  useSearchDisabledSync: vi.fn(),
}));

vi.mock('@/shared/store/useUserStore', () => ({
  useUserStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { user_id: 4, username: 'me', avatar: null } }),
}));

vi.mock('@/shared/client_api/event', () => ({ getEvent: vi.fn() }));

vi.mock('@client_pages/home/widgets/feed/ui/DeepLinkCard', () => ({
  DeepLinkCard: () => null,
}));

vi.mock('@client_pages/home/widgets/feed/ui/EventCard', () => ({
  EventCard: ({ event }: { event: FeedEvent }) => (
    <article>{event.title}</article>
  ),
}));

vi.mock('@client_pages/profile/widgets/editEventModal', () => ({
  EditEventModal: () => null,
}));

vi.mock('@client_pages/profile/widgets/planItModal', () => ({
  PlanItModal: () => null,
}));

import { ProfileFeed } from './ProfileFeed';

describe('ProfileFeed error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.error = null;
    mocks.events = [];
    mocks.sort = 'recent';
    mocks.tab = 'plans';
  });

  afterEach(cleanup);

  it('shows the empty state when the load succeeds with no events', () => {
    render(<ProfileFeed initialUser={null} />);

    expect(
      screen.getByRole('heading', { name: 'No active plans' }),
    ).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('replaces the empty state with a retryable error after a failed load', () => {
    mocks.error = 'Failed to load events';

    render(<ProfileFeed initialUser={null} />);

    expect(screen.getByRole('alert').textContent).toContain(
      'Failed to load events',
    );
    expect(
      screen.queryByRole('heading', { name: 'No active plans' }),
    ).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(mocks.retry).toHaveBeenCalledTimes(1);
  });
});
