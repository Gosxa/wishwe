// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NotificationItem } from '@/shared/client_api/notifications';
import { NotificationsDropdown } from './NotificationsDropdown';

const NOW = new Date('2026-03-15T12:00:00.000Z');

const notification = (
  overrides: Partial<NotificationItem> = {},
): NotificationItem => ({
  id: 1,
  title: 'New friend request',
  message: '👋 amy wants to connect.',
  type: 'friend_request',
  recipient: 'me',
  creator: 'amy',
  related_object_type: 'friendship',
  related_object_id: 7,
  is_read: false,
  created_at: NOW.toISOString(),
  ...overrides,
});

const renderDropdown = (
  overrides: Partial<React.ComponentProps<typeof NotificationsDropdown>> = {},
) => {
  const props: React.ComponentProps<typeof NotificationsDropdown> = {
    id: 'notifications-menu',
    titleId: 'notifications-title',
    notifications: [],
    isLoading: false,
    error: null,
    onRetry: vi.fn(),
    onEventClick: vi.fn(),
    onUserClick: vi.fn(),
    ...overrides,
  };

  return { ...render(<NotificationsDropdown {...props} />), props };
};

const panel = () => screen.getByRole('region', { name: 'Notifications' });

describe('NotificationsDropdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('labels the panel so the trigger can own it', () => {
    renderDropdown();

    const region = panel();

    expect(region.id).toBe('notifications-menu');
    expect(region.getAttribute('aria-labelledby')).toBe('notifications-title');
    expect(
      within(region).getByRole('heading', { name: 'Notifications' }).id,
    ).toBe('notifications-title');
  });

  it('announces the first load and hides the empty message while it runs', () => {
    renderDropdown({ isLoading: true });

    expect(screen.getByRole('status').textContent).toBe(
      'Loading notifications…',
    );
    expect(screen.queryByText('No notifications yet.')).toBeNull();
  });

  it('keeps showing a loaded list while a refresh is in flight', () => {
    renderDropdown({
      isLoading: true,
      notifications: [notification({ message: 'Still here' })],
    });

    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByText('Still here')).toBeTruthy();
  });

  it('reports an empty inbox once loading settles', () => {
    renderDropdown();

    expect(screen.getByText('No notifications yet.')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows a retryable error instead of a misleading empty state', () => {
    const { props } = renderDropdown({
      error: "We couldn't load notifications.",
    });

    const alert = screen.getByRole('alert');

    expect(
      within(alert).getByText("We couldn't load notifications."),
    ).toBeTruthy();
    expect(screen.queryByText('No notifications yet.')).toBeNull();

    fireEvent.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });

  it('keeps the loaded list visible when marking read fails', () => {
    renderDropdown({
      error: "We couldn't mark notifications as read.",
      notifications: [notification({ message: 'Survives the error' })],
    });

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Survives the error')).toBeTruthy();
  });

  it('opens the event modal from an event row', () => {
    const { props } = renderDropdown({
      notifications: [
        notification({
          id: 10,
          message: 'amy joined Friday dinner',
          type: 'joined_event',
          related_object_type: 'event',
          related_object_id: 512,
        }),
      ],
    });

    fireEvent.click(
      screen.getByRole('button', { name: /amy joined Friday dinner/ }),
    );

    expect(props.onEventClick).toHaveBeenCalledWith(512);
    expect(props.onUserClick).not.toHaveBeenCalled();
  });

  it('opens the sender profile from a friendship row', () => {
    const { props } = renderDropdown({
      notifications: [notification({ creator: 'amy' })],
    });

    fireEvent.click(
      screen.getByRole('button', { name: /amy wants to connect/ }),
    );

    expect(props.onUserClick).toHaveBeenCalledWith('amy');
    expect(props.onEventClick).not.toHaveBeenCalled();
  });

  it('renders a friendship row without a creator as plain text', () => {
    renderDropdown({
      notifications: [
        notification({ creator: '', message: 'Someone wants to connect.' }),
      ],
    });

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Someone wants to connect.')).toBeTruthy();
  });

  it('renders every row it is given, keyed by notification id', () => {
    renderDropdown({
      notifications: [
        notification({ id: 1, message: 'First' }),
        notification({
          id: 2,
          message: 'Second',
          related_object_type: 'event',
          related_object_id: 3,
        }),
        notification({ id: 3, message: 'Third', creator: '' }),
      ],
    });

    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.getByText('Second')).toBeTruthy();
    expect(screen.getByText('Third')).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it.each([
    ['2026-03-15T11:59:59.500Z', '0 seconds ago'],
    ['2026-03-15T11:59:30.000Z', '30 seconds ago'],
    ['2026-03-15T11:58:00.000Z', '2 minutes ago'],
    ['2026-03-15T09:00:00.000Z', '3 hours ago'],
    ['2026-03-13T12:00:00.000Z', '2 days ago'],
    ['2026-03-01T12:00:00.000Z', '2 weeks ago'],
    ['2026-01-05T12:00:00.000Z', '2 months ago'],
    ['2024-03-15T12:00:00.000Z', '2 years ago'],
    ['2026-03-18T12:00:00.000Z', 'in 3 days'],
  ])('formats %s as "%s"', (createdAt, expected) => {
    renderDropdown({
      notifications: [notification({ created_at: createdAt })],
    });

    const time = panel().querySelector('time');

    expect(time?.textContent).toBe(expected);
    expect(time?.getAttribute('datetime')).toBe(createdAt);
    expect(time?.getAttribute('title')).toBe(
      new Date(createdAt).toLocaleString(),
    );
  });
});
