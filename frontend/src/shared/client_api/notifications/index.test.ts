import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { emptyResponse, jsonResponse } from '@/shared/client_api/mockResponse';
import { useUserStore } from '@/shared/store/useUserStore';
import {
  getNotifications,
  getUnreadCount,
  NotificationApiError,
  readAllNotifications,
} from './index';

describe('notifications client API', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('window', { location: { href: '/feed' } });
    useUserStore.setState({ user: null });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads notifications and forwards the abort signal', async () => {
    const page = {
      count: 1,
      next: null,
      previous: null,
      results: [{ id: 1, is_read: false }],
    };
    const controller = new AbortController();

    fetchMock.mockResolvedValueOnce(jsonResponse(page));

    await expect(getNotifications(controller.signal)).resolves.toEqual(page);
    expect(fetchMock).toHaveBeenCalledWith('/api/notifications', {
      method: 'GET',
      signal: controller.signal,
    });
  });

  it('loads the unread count and returns the numeric count', async () => {
    const controller = new AbortController();

    fetchMock.mockResolvedValueOnce(jsonResponse({ count: 12 }));

    await expect(getUnreadCount(controller.signal)).resolves.toBe(12);
    expect(fetchMock).toHaveBeenCalledWith('/api/notifications/unread_count', {
      method: 'GET',
      signal: controller.signal,
    });
  });

  it('marks all notifications as read without parsing an empty body', async () => {
    const controller = new AbortController();

    fetchMock.mockResolvedValueOnce(emptyResponse());

    await expect(
      readAllNotifications(controller.signal),
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('/next_api/notifications/read-all', {
      method: 'POST',
      signal: controller.signal,
    });
  });

  it.each([
    [
      'notification list',
      () => getNotifications(),
      'Failed to load notifications',
    ],
    [
      'unread count',
      () => getUnreadCount(),
      'Failed to load unread notification count',
    ],
    [
      'mark-all-read',
      () => readAllNotifications(),
      'Failed to mark notifications as read',
    ],
  ] as const)(
    'throws a status-aware error for a failed %s request',
    async (_, call, message) => {
      fetchMock.mockResolvedValueOnce(jsonResponse({}, 503));

      const failure = call();

      await expect(failure).rejects.toBeInstanceOf(NotificationApiError);
      await expect(failure).rejects.toMatchObject({
        name: 'NotificationApiError',
        message,
        status: 503,
      });
    },
  );

  it('propagates fetch aborts instead of wrapping them as API errors', async () => {
    const abortError = new DOMException(
      'The operation was aborted',
      'AbortError',
    );
    const controller = new AbortController();

    controller.abort();
    fetchMock.mockRejectedValueOnce(abortError);

    await expect(getNotifications(controller.signal)).rejects.toBe(abortError);
  });

  it('clears the user and redirects on 401', async () => {
    useUserStore.setState({ user: {} as never });
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 401));

    await expect(getUnreadCount()).rejects.toThrow('Unauthorized');
    expect(useUserStore.getState().user).toBeNull();
    expect(window.location.href).toBe('/onboard');
  });
});
