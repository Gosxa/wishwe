// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  logout: vi.fn(),
  useNotifications: vi.fn(),
  onEventClick: vi.fn(),
  onUserClick: vi.fn(),
}));

const router = { push: mocks.push };

vi.mock('next/navigation', () => ({ useRouter: () => router }));

vi.mock('@/shared/client_api/auth', () => ({ logout: mocks.logout }));

vi.mock('../model/useNotifications', () => ({
  useNotifications: mocks.useNotifications,
}));

vi.mock('@widgets/createEventModal', () => ({
  CreateEventModal: ({
    defaultType,
    onClose,
    onCreated,
  }: {
    defaultType: string;
    onClose: () => void;
    onCreated: () => void;
  }) => (
    <div role="dialog" aria-label="Create event">
      <span>type:{defaultType}</span>
      <button type="button" onClick={onClose}>
        Dismiss create
      </button>
      <button type="button" onClick={onCreated}>
        Confirm create
      </button>
    </div>
  ),
}));

vi.mock('./NotificationsDropdown', () => ({
  NotificationsDropdown: ({
    onEventClick,
    onUserClick,
    isLoading,
    error,
    onRetry,
  }: {
    onEventClick: (eventId: number) => void;
    onUserClick: (username: string) => void;
    isLoading: boolean;
    error: string | null;
    onRetry: () => void;
  }) => (
    <div role="region" aria-label="Notifications panel">
      <span>{isLoading ? 'loading' : 'idle'}</span>
      <span>{error ?? 'no error'}</span>
      <button type="button" onClick={onRetry}>
        Retry
      </button>
      <button type="button" onClick={() => onEventClick(42)}>
        Open event
      </button>
      <button type="button" onClick={() => onUserClick('@amy lee')}>
        Open user
      </button>
    </div>
  ),
}));

import { Header } from './Header';
import { useCreateEventStore } from '@/shared/store/useCreateEventStore';
import { useEventModalStore } from '@/shared/store/useEventModalStore';
import { useEventsRefreshStore } from '@/shared/store/useEventsRefreshStore';
import { TERMS_OF_USE_URL } from '@/shared/lib/legal';
import s from '../header.module.scss';

describe('Header', () => {
  const retry = vi.fn();

  beforeEach(() => {
    useCreateEventStore.setState({ isOpen: false, defaultType: 'plan' });
    useEventModalStore.setState({ eventId: null });
    useEventsRefreshStore.setState({ refreshToken: 0 });

    mocks.useNotifications.mockReturnValue({
      unreadCount: 0,
      notifications: [],
      isLoading: false,
      error: null,
      retry,
    });

    vi.stubGlobal('open', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  const notificationsButton = () =>
    screen.getByRole('button', { name: /^Notifications/ });
  const settingsButton = () =>
    screen
      .getAllByRole('button')
      .find(
        button =>
          button.classList.contains(s.iconBtn) &&
          !button.getAttribute('aria-label'),
      )!;

  const openSettings = () => fireEvent.click(settingsButton());

  describe('layout', () => {
    it('shows the search bar by default', () => {
      render(<Header />);

      expect(screen.getByPlaceholderText('Search events')).toBeTruthy();
    });

    it('hides the search bar when asked to', () => {
      render(<Header showSearch={false} />);

      expect(screen.queryByPlaceholderText('Search events')).toBeNull();
    });

    it('forwards search props to the search bar', () => {
      const onSearch = vi.fn();

      render(<Header search={{ onSearch }} />);

      const input = screen.getByPlaceholderText('Search events');

      fireEvent.change(input, { target: { value: 'birthday' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSearch).toHaveBeenCalledWith('birthday');
    });

    it('applies the mobile feed layout only when requested', () => {
      const { container, rerender } = render(<Header />);
      const header = () => container.querySelector('header')!;

      expect(header().classList.contains(s.mobileFeedLayout)).toBe(false);

      rerender(<Header mobileFeedLayout />);

      expect(header().classList.contains(s.mobileFeedLayout)).toBe(true);
    });
  });

  describe('create event', () => {
    it('keeps the modal closed until the create button is pressed', () => {
      render(<Header />);

      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('opens the create modal with the default type', () => {
      render(<Header />);

      fireEvent.click(screen.getByRole('button', { name: 'Create' }));

      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText('type:plan')).toBeTruthy();
    });

    it('opens the modal when another part of the app requests it', () => {
      render(<Header />);

      act(() => useCreateEventStore.getState().open());

      expect(screen.getByRole('dialog')).toBeTruthy();
    });

    it('honours the type the store was opened with', () => {
      render(<Header />);

      act(() => useCreateEventStore.getState().open('wish'));

      expect(screen.getByText('type:wish')).toBeTruthy();
    });

    it('closes the modal when it is dismissed', () => {
      render(<Header />);

      fireEvent.click(screen.getByRole('button', { name: 'Create' }));
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss create' }));

      expect(useCreateEventStore.getState().isOpen).toBe(false);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('closes the modal and refreshes the feed after a create', () => {
      render(<Header />);

      fireEvent.click(screen.getByRole('button', { name: 'Create' }));
      fireEvent.click(screen.getByRole('button', { name: 'Confirm create' }));

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(useEventsRefreshStore.getState().refreshToken).toBe(1);
    });

    it('does not refresh the feed when the modal is merely dismissed', () => {
      render(<Header />);

      fireEvent.click(screen.getByRole('button', { name: 'Create' }));
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss create' }));

      expect(useEventsRefreshStore.getState().refreshToken).toBe(0);
    });
  });

  describe('notifications', () => {
    it('only fetches the list while the dropdown is open', () => {
      render(<Header />);

      expect(mocks.useNotifications).toHaveBeenLastCalledWith(false);

      fireEvent.click(notificationsButton());

      expect(mocks.useNotifications).toHaveBeenLastCalledWith(true);
    });

    it('announces the unread count to assistive tech', () => {
      mocks.useNotifications.mockReturnValue({
        unreadCount: 3,
        notifications: [],
        isLoading: false,
        error: null,
        retry,
      });

      render(<Header />);

      expect(notificationsButton().getAttribute('aria-label')).toBe(
        'Notifications, 3 unread',
      );
    });

    it('leaves the count out of the label when everything is read', () => {
      render(<Header />);

      expect(notificationsButton().getAttribute('aria-label')).toBe(
        'Notifications',
      );
    });

    it('toggles the dropdown open and closed', () => {
      render(<Header />);

      fireEvent.click(notificationsButton());
      expect(
        screen.getByRole('region', { name: 'Notifications panel' }),
      ).toBeTruthy();

      fireEvent.click(notificationsButton());
      expect(
        screen.queryByRole('region', { name: 'Notifications panel' }),
      ).toBeNull();
    });

    it('passes the loading and error state straight through', () => {
      mocks.useNotifications.mockReturnValue({
        unreadCount: 0,
        notifications: [],
        isLoading: true,
        error: 'Network down',
        retry,
      });

      render(<Header />);
      fireEvent.click(notificationsButton());

      expect(screen.getByText('loading')).toBeTruthy();
      expect(screen.getByText('Network down')).toBeTruthy();

      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

      expect(retry).toHaveBeenCalledOnce();
    });

    it('opens the event modal and closes the dropdown on an event click', () => {
      render(<Header />);

      fireEvent.click(notificationsButton());
      fireEvent.click(screen.getByRole('button', { name: 'Open event' }));

      expect(useEventModalStore.getState().eventId).toBe('42');
      expect(
        screen.queryByRole('region', { name: 'Notifications panel' }),
      ).toBeNull();
    });

    it('navigates to a profile, stripping the @ and encoding the handle', () => {
      render(<Header />);

      fireEvent.click(notificationsButton());
      fireEvent.click(screen.getByRole('button', { name: 'Open user' }));

      expect(mocks.push).toHaveBeenCalledWith('/user/amy%20lee');
      expect(
        screen.queryByRole('region', { name: 'Notifications panel' }),
      ).toBeNull();
    });
  });

  describe('settings menu', () => {
    it('stays closed until the gear is pressed', () => {
      render(<Header />);

      expect(screen.queryByText('Log out')).toBeNull();
    });

    it('lists every settings action', () => {
      render(<Header />);
      openSettings();

      ['Edit profile', 'Support', 'Terms of Use', 'Log out'].forEach(label => {
        expect(screen.getByRole('button', { name: label })).toBeTruthy();
      });
    });

    it('toggles closed on a second press', () => {
      render(<Header />);
      openSettings();
      openSettings();

      expect(screen.queryByText('Log out')).toBeNull();
    });

    it('logs the user out', () => {
      render(<Header />);
      openSettings();
      fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

      expect(mocks.logout).toHaveBeenCalledOnce();
    });

    it('navigates to the edit profile page and closes the menu', () => {
      render(<Header />);
      openSettings();
      fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));

      expect(mocks.push).toHaveBeenCalledWith('/edit-profile');
      expect(screen.queryByText('Log out')).toBeNull();
    });

    it('opens the terms in a new tab without leaking the opener', () => {
      render(<Header />);
      openSettings();
      fireEvent.click(screen.getByRole('button', { name: 'Terms of Use' }));

      expect(window.open).toHaveBeenCalledWith(
        TERMS_OF_USE_URL,
        '_blank',
        'noopener,noreferrer',
      );
      expect(screen.queryByText('Log out')).toBeNull();
    });
  });

  describe('dismissing the open menu', () => {
    it('closes the settings menu on Escape', () => {
      render(<Header />);
      openSettings();
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByText('Log out')).toBeNull();
    });

    it('closes the notifications dropdown on Escape', () => {
      render(<Header />);
      fireEvent.click(notificationsButton());
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(
        screen.queryByRole('region', { name: 'Notifications panel' }),
      ).toBeNull();
    });

    it('ignores other keys', () => {
      render(<Header />);
      openSettings();
      fireEvent.keyDown(document, { key: 'Enter' });

      expect(screen.getByRole('button', { name: 'Log out' })).toBeTruthy();
    });

    it('closes when the pointer lands outside the header actions', () => {
      render(<Header />);
      openSettings();
      fireEvent.pointerDown(document.body);

      expect(screen.queryByText('Log out')).toBeNull();
    });

    it('stays open when the pointer lands inside the actions', () => {
      render(<Header />);
      openSettings();
      fireEvent.pointerDown(screen.getByRole('button', { name: 'Log out' }));

      expect(screen.getByRole('button', { name: 'Log out' })).toBeTruthy();
    });

    it('does not listen for outside pointers while both menus are closed', () => {
      const addEventListener = vi.spyOn(document, 'addEventListener');

      render(<Header />);

      expect(addEventListener).not.toHaveBeenCalledWith(
        'pointerdown',
        expect.any(Function),
      );

      addEventListener.mockRestore();
    });
  });

  it('keeps only one menu open at a time', () => {
    render(<Header />);

    fireEvent.click(notificationsButton());
    openSettings();

    expect(screen.getByRole('button', { name: 'Log out' })).toBeTruthy();
    expect(
      screen.queryByRole('region', { name: 'Notifications panel' }),
    ).toBeNull();

    fireEvent.click(notificationsButton());

    expect(screen.queryByText('Log out')).toBeNull();
    expect(
      screen.getByRole('region', { name: 'Notifications panel' }),
    ).toBeTruthy();
  });

  it('exposes the tour anchors the product tour relies on', () => {
    const { container } = render(<Header />);

    expect(container.querySelector('[data-tour="create-event"]')).toBeTruthy();
    expect(container.querySelector('[data-tour="notifications"]')).toBeTruthy();
  });
});
