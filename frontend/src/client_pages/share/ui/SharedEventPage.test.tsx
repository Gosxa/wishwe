// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  BackendEvent,
  EventPreview,
  SharedEventResponse,
} from '@/shared/client_api/event';

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn(),
}));

const userApiMocks = vi.hoisted(() => ({
  sendFriendRequest: vi.fn(),
}));

const uiMocks = vi.hoisted(() => ({
  eventCard: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: navigationMocks.replace }),
}));

vi.mock('@/shared/client_api/user', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/shared/client_api/user')>();

  return { ...actual, sendFriendRequest: userApiMocks.sendFriendRequest };
});

vi.mock('@client_pages/home', () => ({
  HomePage: () => <main data-testid="feed-background" />,
}));

vi.mock('@client_pages/landing', () => ({
  LandingPage: () => <main data-testid="landing-background" />,
}));

vi.mock('@client_pages/home/widgets/feed/ui/EventCard', () => ({
  EventCard: (props: {
    event: { title: string };
    onDetailsClose?: () => void;
  }) => {
    uiMocks.eventCard(props);

    return (
      <button type="button" onClick={props.onDetailsClose}>
        Full event: {props.event.title}
      </button>
    );
  },
}));

import { SendFriendRequestError } from '@/shared/client_api/user';
import SharedEventPage from './SharedEventPage';

const event: BackendEvent = {
  id: 42,
  creator: 'maya',
  creator_avatar: null,
  mutual_friend: null,
  category: 'Travel',
  event_type: 'plan',
  event_visibility: 'friends',
  status: 'active',
  title: 'Weekend in Lviv',
  description: 'A short city trip',
  cover_image: null,
  location: 'Lviv',
  external_link: null,
  event_date: '2026-09-12',
  event_time: '10:00:00',
  timeframe_text: null,
  min_participants: 2,
  max_participants: 6,
  participants_count: 1,
  interested_count: 0,
  participants_preview: [],
  created_at: '2026-08-13T09:00:00Z',
  is_full: false,
  available_spots: 5,
  user_participation_status: null,
};

const preview: EventPreview = {
  id: event.id,
  title: event.title,
  description: event.description,
  cover_image: null,
  creator: {
    id: 9,
    username: 'maya',
    avatar: null,
  },
};

const fullAccess: SharedEventResponse = {
  has_access: true,
  event,
  preview: null,
};

const privateAccess: SharedEventResponse = {
  has_access: false,
  event: null,
  preview,
};

describe('SharedEventPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userApiMocks.sendFriendRequest.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it('opens an accessible event over the feed and returns to the feed', () => {
    render(
      <SharedEventPage
        shared={{ status: 'ok', data: fullAccess }}
        isAuthenticated
        loginHref="/onboard?next=%2Fshare%2Ftoken"
        creatorFriendshipStatus="friends"
      />,
    );

    expect(screen.getByTestId('feed-background')).toBeTruthy();
    expect(screen.queryByTestId('landing-background')).toBeNull();
    expect(screen.getByText('Full event: Weekend in Lviv')).toBeTruthy();
    expect(uiMocks.eventCard).toHaveBeenCalledWith(
      expect.objectContaining({
        event: expect.objectContaining({ id: '42', title: event.title }),
        enableDetails: true,
        autoOpenDetails: true,
        detailsOnly: true,
      }),
    );

    fireEvent.click(screen.getByText('Full event: Weekend in Lviv'));

    expect(navigationMocks.replace).toHaveBeenCalledWith('/feed', {
      scroll: false,
    });
    expect(screen.queryByText('Full event: Weekend in Lviv')).toBeNull();
  });

  it('shows a private preview and handles an already-sent friend request', async () => {
    userApiMocks.sendFriendRequest.mockRejectedValueOnce(
      new SendFriendRequestError(400, 'A friend request already exists'),
    );

    render(
      <SharedEventPage
        shared={{ status: 'ok', data: privateAccess }}
        isAuthenticated
        loginHref="/onboard?next=%2Fshare%2Ftoken"
        creatorFriendshipStatus="none"
      />,
    );

    expect(
      screen.getByRole('dialog', { name: 'Weekend in Lviv' }),
    ).toBeTruthy();
    expect(screen.getByText('Private event')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Add friend' }));

    await waitFor(() => {
      expect(screen.getByText('Requested')).toBeTruthy();
    });
    expect(userApiMocks.sendFriendRequest).toHaveBeenCalledWith(9);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('gives an anonymous visitor a login link that keeps the share path', () => {
    const loginHref = '/onboard?next=%2Fshare%2Fsummer-token';

    render(
      <SharedEventPage
        shared={{ status: 'ok', data: privateAccess }}
        isAuthenticated={false}
        loginHref={loginHref}
        creatorFriendshipStatus={null}
      />,
    );

    expect(screen.getByTestId('landing-background')).toBeTruthy();
    expect(screen.queryByTestId('feed-background')).toBeNull();
    expect(
      screen
        .getByRole('link', { name: 'Login to your account' })
        .getAttribute('href'),
    ).toBe(loginHref);
    expect(screen.getByText('Log in to check your access')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Add friend' })).toBeNull();
  });

  it.each([
    {
      isAuthenticated: true,
      actionLabel: 'Go to feed',
      destination: '/feed',
      background: 'feed-background',
    },
    {
      isAuthenticated: false,
      actionLabel: 'Go to home',
      destination: '/',
      background: 'landing-background',
    },
  ])(
    'shows an expired-link message and returns to $destination',
    ({ isAuthenticated, actionLabel, destination, background }) => {
      render(
        <SharedEventPage
          shared={{ status: 'not-found' }}
          isAuthenticated={isAuthenticated}
          loginHref="/onboard?next=%2Fshare%2Fexpired"
          creatorFriendshipStatus={null}
        />,
      );

      expect(screen.getByTestId(background)).toBeTruthy();
      expect(
        screen.getByRole('alertdialog', {
          name: "This link doesn't work anymore",
        }),
      ).toBeTruthy();

      fireEvent.click(screen.getByRole('button', { name: actionLabel }));

      expect(navigationMocks.replace).toHaveBeenCalledWith(destination, {
        scroll: false,
      });
      expect(screen.queryByRole('alertdialog')).toBeNull();
    },
  );
});
