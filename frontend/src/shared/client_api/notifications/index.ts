import type { NotificationsPage } from './types';

export class NotificationApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'NotificationApiError';
  }
}

const ensureOk = (response: Response, message: string) => {
  if (!response.ok) {
    throw new NotificationApiError(message, response.status);
  }
};

export const getNotifications = async (
  signal?: AbortSignal,
): Promise<NotificationsPage> => {
  const response = await fetch('/api/notifications', {
    method: 'GET',
    signal,
  });

  ensureOk(response, 'Failed to load notifications');

  return (await response.json()) as NotificationsPage;
};

export const getUnreadCount = async (signal?: AbortSignal): Promise<number> => {
  const response = await fetch('/api/notifications/unread-count', {
    method: 'GET',
    signal,
  });

  ensureOk(response, 'Failed to load unread notification count');

  const body = (await response.json()) as { count: number };

  return body.count;
};

export const readAllNotifications = async (
  signal?: AbortSignal,
): Promise<void> => {
  const response = await fetch('/next_api/notifications/read-all', {
    method: 'POST',
    signal,
  });

  ensureOk(response, 'Failed to mark notifications as read');
};

export type { NotificationItem, NotificationsPage } from './types';
