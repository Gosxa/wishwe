import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getUnreadNotificationCount,
  listNotifications,
  markNotificationAsRead,
  readAllNotifications,
} from '@/lib/api/notifications';

const apiRequestMock = vi.fn();

vi.mock('@/lib/api/client', () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

describe('notifications api', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it('lists notifications with page parameter', async () => {
    apiRequestMock.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });

    await listNotifications(2);

    expect(apiRequestMock).toHaveBeenCalledWith('/api/notifications/?page=2', { auth: true });
  });

  it('marks a notification as read with POST and trailing slash', async () => {
    apiRequestMock.mockResolvedValue(undefined);

    await markNotificationAsRead(17);

    expect(apiRequestMock).toHaveBeenCalledWith('/api/notifications/17/mark_as_read/', {
      method: 'POST',
      auth: true,
    });
  });

  it('reads all notifications with POST', async () => {
    apiRequestMock.mockResolvedValue({ updated: 3 });

    const result = await readAllNotifications();

    expect(apiRequestMock).toHaveBeenCalledWith('/api/notifications/read_all/', {
      method: 'POST',
      auth: true,
    });
    expect(result).toEqual({ updated: 3 });
  });

  it('fetches unread notification count', async () => {
    apiRequestMock.mockResolvedValue({ count: 5 });

    const result = await getUnreadNotificationCount();

    expect(apiRequestMock).toHaveBeenCalledWith('/api/notifications/unread_count/', {
      auth: true,
    });
    expect(result).toEqual({ count: 5 });
  });
});
