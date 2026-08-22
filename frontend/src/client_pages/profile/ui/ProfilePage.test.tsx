// @vitest-environment jsdom

import type { ChangeEvent, ReactNode } from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FeedEvent } from '@client_pages/home/model/types';
import type { Profile } from '@/shared/client_api/auth/types';
import type { BackendEvent } from '@/shared/client_api/event';

const mocks = vi.hoisted(() => ({
  clearEventParam: vi.fn(),
  copyInvite: vi.fn(),
  events: [] as FeedEvent[],
  getEvent: vi.fn(),
  openCreate: vi.fn(),
  openEventId: null as string | null,
  search: '',
  setEventParam: vi.fn(),
  setSort: vi.fn(),
  setTab: vi.fn(),
  showDeepLinkCard: false,
  sort: 'recent' as 'recent' | 'soonest',
  storeUser: null as Profile | null,
  syncSearchDisabled: vi.fn(),
  tab: 'plans' as 'plans' | 'wishes' | 'archive',
  useEditEvent: vi.fn(),
  usePlanIt: vi.fn(),
  useProfileEvents: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'title' ? mocks.search : null),
  }),
}));

vi.mock('@/shared/client_api/event', () => ({
  getEvent: mocks.getEvent,
}));

vi.mock('@client_pages/profile/model/useProfileSearch', () => ({
  SEARCH_PARAM: 'title',
  useProfileSearch: () => ({ onChange: vi.fn(), value: mocks.search }),
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

vi.mock('@/shared/store/useUserStore', () => ({
  useUserStore: (selector: (state: { user: Profile | null }) => unknown) =>
    selector({ user: mocks.storeUser }),
}));

vi.mock('@/shared/store/useCreateEventStore', () => ({
  useCreateEventStore: (
    selector: (state: { open: (type: 'plan' | 'wish') => void }) => unknown,
  ) => selector({ open: mocks.openCreate }),
}));

vi.mock('@widgets/header', () => ({
  Header: ({
    search,
  }: {
    search: {
      disabled: boolean;
      disabledHint: string;
      onChange: (value: string) => void;
      placeholder: string;
      value: string;
    };
  }) => (
    <input
      aria-label={search.placeholder}
      data-disabled-hint={search.disabledHint}
      disabled={search.disabled}
      value={search.value}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        search.onChange(event.target.value)
      }
    />
  ),
}));

vi.mock('@client_pages/home/widgets/feed/ui/DeepLinkCard', () => ({
  DeepLinkCard: () => null,
}));

vi.mock('@client_pages/home/widgets/feed/ui/EventCard', () => ({
  EventCard: ({
    event,
    onEdit,
    onPlanIt,
  }: {
    event: FeedEvent;
    onEdit: (id: string) => void;
    onPlanIt: (id: string) => void;
  }) => (
    <article>
      <span>{event.title}</span>
      <button type="button" onClick={() => onEdit(String(event.id))}>
        Edit event
      </button>
      <button type="button" onClick={() => onPlanIt(String(event.id))}>
        Plan it
      </button>
    </article>
  ),
}));

vi.mock(
  '@client_pages/profile/widgets/editEventModal/model/useEditEvent',
  () => ({ useEditEvent: mocks.useEditEvent }),
);

vi.mock('@client_pages/profile/widgets/planItModal/model/usePlanIt', () => ({
  usePlanIt: mocks.usePlanIt,
}));

vi.mock('@shared/hooks/useModalTransition', () => ({
  useModalTransition: (onClose: () => void) => ({
    modalTransitionProps: {},
    requestClose: onClose,
    requestCloseWith: (callback: () => void) => {
      onClose();
      callback();
    },
  }),
}));

vi.mock('@/features/eventForm', () => ({
  EventFormModal: ({ onClose }: { onClose: () => void }) => (
    <section aria-label="Edit event modal">
      <button type="button" onClick={onClose}>
        Close edit modal
      </button>
    </section>
  ),
  EventFormModalLayout: ({
    children,
    onClose,
    title,
  }: {
    children: ReactNode;
    onClose: () => void;
    title: string;
  }) => (
    <section aria-label={`${title} modal`}>
      {children}
      <button type="button" onClick={onClose}>
        Close plan modal
      </button>
    </section>
  ),
  EventTypePreview: () => null,
  PlanConversionFields: ({ eventTitle }: { eventTitle: string }) => (
    <p>Planning {eventTitle}</p>
  ),
}));

import ProfilePage from './ProfilePage';

const profile: Profile = {
  id: 1,
  user: 'alice@example.com',
  user_id: 7,
  username: 'alice',
  first_name: 'Alice',
  last_name: null,
  bio: 'Always planning something',
  date_of_birth: null,
  city: null,
  gender: null,
  avatar: null,
  social_media_url: null,
  is_private: false,
  has_seen_feed_tour: true,
};

const feedEvent = {
  id: 'event-7',
  type: 'plan',
  image: '/event.jpg',
  title: 'Sunset picnic',
  host: { username: '@alice' },
  date: 'Sunday',
  startsAt: null,
  createdAt: 1,
  location: 'The park',
  chatLink: null,
  participantCount: 2,
  maxParticipants: 6,
  participants: [],
  userParticipationStatus: null,
} satisfies FeedEvent;

const backendEvent: BackendEvent = {
  id: 7,
  creator: 'alice',
  creator_avatar: null,
  mutual_friend: null,
  category: 'Outdoors',
  event_type: 'plan',
  event_visibility: 'friends',
  status: 'active',
  title: 'Sunset picnic',
  description: 'Bring snacks',
  cover_image: null,
  location: 'The park',
  external_link: null,
  event_date: '2026-08-23',
  event_time: '18:00:00',
  timeframe_text: null,
  min_participants: 2,
  max_participants: 6,
  participants_count: 2,
  interested_count: 0,
  participants_preview: [],
  created_at: '2026-08-21T10:00:00Z',
  is_full: false,
  available_spots: 4,
  user_participation_status: null,
};

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.events = [feedEvent];
    mocks.openEventId = null;
    mocks.search = '';
    mocks.showDeepLinkCard = false;
    mocks.sort = 'recent';
    mocks.storeUser = profile;
    mocks.tab = 'plans';
    mocks.getEvent.mockResolvedValue(backendEvent);
    mocks.useEditEvent.mockReturnValue({});
    mocks.usePlanIt.mockReturnValue({
      participants: {
        max: 2,
        min: 1,
        onMaxChange: vi.fn(),
        onMinChange: vi.fn(),
        onUnlimitedChange: vi.fn(),
        unlimited: false,
      },
      submit: { error: undefined, isSubmitting: false, onSubmit: vi.fn() },
      when: {
        date: '',
        dateError: undefined,
        minDate: '2026-08-21',
        minTime: '',
        onDateChange: vi.fn(),
        onTimeChange: vi.fn(),
        time: '',
        timeError: undefined,
      },
    });
    mocks.useProfileEvents.mockReturnValue({
      events: mocks.events,
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      loadMore: vi.fn(),
    });
  });

  afterEach(cleanup);

  it('assembles profile identity, navigation, search, and feed controls', () => {
    render(<ProfilePage initialUser={profile} />);

    expect(
      screen.getByRole('textbox', { name: 'Search my events' }),
    ).toBeTruthy();
    expect(screen.getByRole('heading', { name: '@alice' })).toBeTruthy();
    expect(screen.getByText('Always planning something')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Edit profile' }).getAttribute('href'),
    ).toBe('/edit-profile');
    expect(
      screen
        .getByRole('link', { name: 'Profile' })
        .getAttribute('aria-current'),
    ).toBe('page');
    expect(screen.getByText('Sunset picnic')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Copy link!' }));
    fireEvent.click(screen.getByRole('button', { name: 'Wishes' }));

    expect(mocks.copyInvite).toHaveBeenCalledTimes(1);
    expect(mocks.setTab).toHaveBeenCalledWith('wishes');
    expect(mocks.syncSearchDisabled).toHaveBeenCalledWith(
      expect.any(Function),
      [feedEvent],
      '',
    );
  });

  it('loads the selected event before opening edit and plan-conversion modals', async () => {
    render(<ProfilePage initialUser={profile} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit event' }));

    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: 'Edit event modal' }),
      ).toBeTruthy();
    });
    expect(mocks.getEvent).toHaveBeenCalledWith('event-7');
    expect(mocks.useEditEvent).toHaveBeenCalledWith(
      backendEvent,
      expect.any(Function),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close edit modal' }));
    expect(
      screen.queryByRole('region', { name: 'Edit event modal' }),
    ).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Plan it' }));

    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: 'Create a plan modal' }),
      ).toBeTruthy();
    });
    expect(screen.getByText('Planning Sunset picnic')).toBeTruthy();
    expect(mocks.usePlanIt).toHaveBeenCalledWith(
      backendEvent,
      expect.any(Function),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close plan modal' }));
    expect(screen.queryByText('Planning Sunset picnic')).toBeNull();
  });

  it('refreshes or switches the feed after successful modal actions', async () => {
    render(<ProfilePage initialUser={profile} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit event' }));
    await waitFor(() => expect(mocks.useEditEvent).toHaveBeenCalled());

    const onSaved = mocks.useEditEvent.mock.calls.at(-1)?.[1] as () => void;

    act(onSaved);

    expect(
      screen.queryByRole('region', { name: 'Edit event modal' }),
    ).toBeNull();
    expect(mocks.useProfileEvents).toHaveBeenLastCalledWith(
      expect.objectContaining({ refreshKey: 1 }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Plan it' }));
    await waitFor(() => expect(mocks.usePlanIt).toHaveBeenCalled());

    const onConverted = mocks.usePlanIt.mock.calls.at(-1)?.[1] as () => void;

    act(onConverted);

    expect(mocks.setTab).toHaveBeenCalledWith('plans');
    expect(
      screen.queryByRole('region', { name: 'Create a plan modal' }),
    ).toBeNull();
  });

  it('renders the profile empty state and opens plan creation', () => {
    mocks.events = [];
    mocks.useProfileEvents.mockReturnValue({
      events: [],
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      loadMore: vi.fn(),
    });

    render(<ProfilePage initialUser={profile} />);

    expect(
      screen.getByRole('heading', { name: 'No active plans' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Create a plan' }));
    expect(mocks.openCreate).toHaveBeenCalledWith('plan');
  });
});
