// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  NotificationItem,
  NotificationsPage,
} from '@/shared/client_api/notifications';

type SocketEvent =
  | { type: 'connected' }
  | { type: 'notification'; notification: NotificationItem };

const apiMocks = vi.hoisted(() => ({
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  readAllNotifications: vi.fn(),
}));

const socketMocks = vi.hoisted(() => ({
  subscribe: vi.fn(),
  emit: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock('@/shared/client_api/notifications', () => ({
  getNotifications: apiMocks.getNotifications,
  getUnreadCount: apiMocks.getUnreadCount,
  readAllNotifications: apiMocks.readAllNotifications,
}));

vi.mock('@/shared/client_api/notifications/socket', () => ({
  subscribeToNotificationSocket: socketMocks.subscribe,
}));

import { useNotifications } from './useNotifications';

const notificationsPage = (results: NotificationItem[]): NotificationsPage => ({
  count: results.length,
  next: null,
  previous: null,
  results,
});

const notification = (
  id: number,
  isRead: boolean = true,
): NotificationItem => ({
  id,
  title: `Notification ${id}`,
  message: `Message ${id}`,
  type: 'event_updated',
  recipient: 'recipient',
  creator: `creator-${id}`,
  related_object_type: 'event',
  related_object_id: id,
  is_read: isRead,
  created_at: `2026-08-${String(id).padStart(2, '0')}T12:00:00Z`,
});

const abortError = () => {
  const error = new Error('aborted');

  error.name = 'AbortError';

  return error;
};

const rejectOnAbort = <T>(signal?: AbortSignal): Promise<T> =>
  new Promise<T>((_resolve, reject) => {
    const rejectRequest = () => reject(abortError());

    if (signal?.aborted) {
      rejectRequest();
    } else {
      signal?.addEventListener('abort', rejectRequest, { once: true });
    }
  });

const flushPromises = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

const advance = async (milliseconds: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
};

const emitSocketEvent = async (event: SocketEvent) => {
  await act(async () => {
    socketMocks.emit(event);
    await Promise.resolve();
  });
};

describe('useNotifications', () => {
  let visibility: DocumentVisibilityState;
  let online: boolean;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-12T12:00:00Z'));

    apiMocks.getNotifications.mockReset();
    apiMocks.getUnreadCount.mockReset();
    apiMocks.readAllNotifications.mockReset();
    socketMocks.subscribe.mockReset();
    socketMocks.emit.mockReset();
    socketMocks.unsubscribe.mockReset();

    socketMocks.subscribe.mockImplementation(
      (listener: (event: SocketEvent) => void) => {
        socketMocks.emit.mockImplementation(listener);
        return socketMocks.unsubscribe;
      },
    );

    apiMocks.getUnreadCount.mockResolvedValue(0);
    apiMocks.getNotifications.mockResolvedValue(notificationsPage([]));
    apiMocks.readAllNotifications.mockResolvedValue(undefined);

    visibility = 'visible';
    online = true;

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    });
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => online,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('loads the unread count on mount and refreshes after socket reconnects', async () => {
    apiMocks.getUnreadCount.mockResolvedValueOnce(2).mockResolvedValueOnce(5);

    const { result } = renderHook(() => useNotifications(false));

    await flushPromises();

    expect(apiMocks.getUnreadCount).toHaveBeenCalledTimes(1);
    expect(result.current.unreadCount).toBe(2);
    expect(apiMocks.getNotifications).not.toHaveBeenCalled();

    await emitSocketEvent({ type: 'connected' });
    await flushPromises();

    expect(apiMocks.getUnreadCount).toHaveBeenCalledTimes(2);
    expect(result.current.unreadCount).toBe(5);
    await advance(300_000);
    expect(apiMocks.getUnreadCount).toHaveBeenCalledTimes(2);
  });

  it('retries an unread count request after the socket reconnects', async () => {
    apiMocks.getUnreadCount
      .mockRejectedValueOnce(new Error('server error'))
      .mockResolvedValueOnce(5);

    const { result } = renderHook(() => useNotifications(false));
    await flushPromises();

    expect(apiMocks.getUnreadCount).toHaveBeenCalledTimes(1);

    await emitSocketEvent({ type: 'connected' });
    await flushPromises();

    expect(apiMocks.getUnreadCount).toHaveBeenCalledTimes(2);
    expect(result.current.unreadCount).toBe(5);
  });

  it('refreshes the unread count on each socket reconnect', async () => {
    apiMocks.getUnreadCount
      .mockRejectedValueOnce(new Error('first failure'))
      .mockResolvedValueOnce(1)
      .mockRejectedValueOnce(new Error('failure after success'))
      .mockResolvedValueOnce(2);

    const { result } = renderHook(() => useNotifications(false));

    await flushPromises();
    await emitSocketEvent({ type: 'connected' });
    await flushPromises();

    expect(result.current.unreadCount).toBe(1);

    await emitSocketEvent({ type: 'connected' });
    await flushPromises();
    expect(apiMocks.getUnreadCount).toHaveBeenCalledTimes(3);
    await emitSocketEvent({ type: 'connected' });
    await flushPromises();

    expect(apiMocks.getUnreadCount).toHaveBeenCalledTimes(4);
    expect(result.current.unreadCount).toBe(2);
  });

  it('aborts the open list while hidden and reloads it when visible or online', async () => {
    apiMocks.getNotifications.mockImplementation((signal?: AbortSignal) =>
      rejectOnAbort<NotificationsPage>(signal),
    );
    visibility = 'hidden';

    renderHook(() => useNotifications(true));
    await advance(0);

    const firstSignal = apiMocks.getNotifications.mock
      .calls[0][0] as AbortSignal;
    expect(apiMocks.getNotifications).toHaveBeenCalledTimes(1);

    visibility = 'hidden';
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
    });
    expect(firstSignal.aborted).toBe(true);

    visibility = 'visible';
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
    });
    await advance(0);
    expect(apiMocks.getNotifications).toHaveBeenCalledTimes(2);

    online = false;
    window.dispatchEvent(new Event('offline'));
    const secondSignal = apiMocks.getNotifications.mock
      .calls[1][0] as AbortSignal;
    expect(secondSignal.aborted).toBe(true);

    online = true;
    await act(async () => {
      window.dispatchEvent(new Event('online'));
      await Promise.resolve();
    });
    await advance(0);
    expect(apiMocks.getNotifications).toHaveBeenCalledTimes(3);
  });

  it('unsubscribes from socket events when unmounted', async () => {
    const { unmount } = renderHook(() => useNotifications(false));

    await flushPromises();
    expect(socketMocks.subscribe).toHaveBeenCalledOnce();

    unmount();

    expect(socketMocks.unsubscribe).toHaveBeenCalledOnce();
  });

  it('opens the list, aborts it on close, and does not retry while closed', async () => {
    apiMocks.getNotifications.mockImplementation((signal?: AbortSignal) =>
      rejectOnAbort<NotificationsPage>(signal),
    );

    const { result, rerender } = renderHook(
      ({ isOpen }: { isOpen: boolean }) => useNotifications(isOpen),
      { initialProps: { isOpen: false } },
    );

    await flushPromises();

    expect(apiMocks.getNotifications).not.toHaveBeenCalled();

    rerender({ isOpen: true });
    await advance(0);

    expect(apiMocks.getNotifications).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(true);

    const signal = apiMocks.getNotifications.mock.calls[0][0] as AbortSignal;

    rerender({ isOpen: false });
    await flushPromises();

    expect(signal.aborted).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    await act(async () => result.current.retry());

    expect(apiMocks.getNotifications).toHaveBeenCalledTimes(1);
  });

  it('sorts newest first, limits the list to ten, and marks unread items read', async () => {
    const unordered = [4, 12, 1, 8, 3, 11, 6, 2, 10, 5, 9, 7].map(id =>
      notification(id, id !== 12),
    );

    apiMocks.getNotifications.mockResolvedValueOnce(
      notificationsPage(unordered),
    );

    const { result } = renderHook(() => useNotifications(true));

    await advance(0);

    expect(result.current.notifications.map(item => item.id)).toEqual([
      12, 11, 10, 9, 8, 7, 6, 5, 4, 3,
    ]);
    expect(result.current.notifications.every(item => item.is_read)).toBe(true);
    expect(result.current.unreadCount).toBe(0);
    expect(apiMocks.readAllNotifications).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('marks all read when the unread counter is positive', async () => {
    apiMocks.getUnreadCount.mockResolvedValueOnce(3);
    apiMocks.getNotifications.mockResolvedValueOnce(
      notificationsPage([notification(1), notification(2)]),
    );

    const { result, rerender } = renderHook(
      ({ isOpen }: { isOpen: boolean }) => useNotifications(isOpen),
      { initialProps: { isOpen: false } },
    );

    await flushPromises();

    expect(result.current.unreadCount).toBe(3);

    rerender({ isOpen: true });
    await advance(0);

    expect(apiMocks.readAllNotifications).toHaveBeenCalledTimes(1);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications.every(item => item.is_read)).toBe(true);
  });

  it('refreshes an open list when a new notification arrives over the socket', async () => {
    apiMocks.getNotifications
      .mockResolvedValueOnce(notificationsPage([notification(1)]))
      .mockResolvedValueOnce(notificationsPage([notification(2, false)]));

    const { result } = renderHook(() => useNotifications(true));

    await advance(0);

    expect(result.current.notifications.map(item => item.id)).toEqual([1]);

    await emitSocketEvent({
      type: 'notification',
      notification: notification(2, false),
    });
    await advance(0);

    expect(apiMocks.getNotifications).toHaveBeenCalledTimes(2);
    expect(result.current.notifications.map(item => item.id)).toEqual([2]);
    expect(result.current.notifications[0].is_read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it('shows list errors and clears them after a successful retry', async () => {
    apiMocks.getNotifications
      .mockRejectedValueOnce(new Error('server error'))
      .mockResolvedValueOnce(notificationsPage([notification(1)]));

    const { result } = renderHook(() => useNotifications(true));

    await advance(0);

    expect(result.current.error).toBe("We couldn't load notifications.");
    expect(result.current.isLoading).toBe(false);

    await act(async () => result.current.retry());

    expect(result.current.error).toBeNull();
    expect(result.current.notifications.map(item => item.id)).toEqual([1]);
  });

  it('reports a mark-all-read failure without hiding the loaded list', async () => {
    apiMocks.getNotifications.mockResolvedValueOnce(
      notificationsPage([notification(1, false)]),
    );
    apiMocks.readAllNotifications.mockRejectedValueOnce(
      new Error('server error'),
    );

    const { result } = renderHook(() => useNotifications(true));

    await advance(0);

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].is_read).toBe(false);
    expect(result.current.error).toBe(
      "We couldn't mark notifications as read.",
    );
    expect(result.current.isLoading).toBe(false);
  });

  it('aborts an open list request and unsubscribes when unmounted', async () => {
    apiMocks.getNotifications.mockImplementation((signal?: AbortSignal) =>
      rejectOnAbort<NotificationsPage>(signal),
    );

    const { unmount } = renderHook(() => useNotifications(true));

    await advance(0);

    const listSignal = apiMocks.getNotifications.mock
      .calls[0][0] as AbortSignal;

    unmount();

    expect(listSignal.aborted).toBe(true);
    expect(socketMocks.unsubscribe).toHaveBeenCalledOnce();
  });
});
