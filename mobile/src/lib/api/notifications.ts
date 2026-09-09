import { apiRequest } from '@/lib/api/client';

export type BackendNotification = {
  id: number;
  title: string;
  message: string;
  type: string;
  recipient: string;
  creator: string;
  related_object_type: 'event' | 'friendship';
  related_object_id: number;
  is_read: boolean;
  created_at: string;
};

export type PaginatedNotifications = {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendNotification[];
};

export function listNotifications(page = 1): Promise<PaginatedNotifications> {
  return apiRequest<PaginatedNotifications>(`/api/notifications/?page=${page}`, {
    auth: true,
  });
}

export function markNotificationAsRead(id: number): Promise<void> {
  return apiRequest<void>(`/api/notifications/${id}/mark_as_read/`, {
    method: 'POST',
    auth: true,
  });
}

export function readAllNotifications(): Promise<{ updated: number }> {
  return apiRequest<{ updated: number }>('/api/notifications/read_all/', {
    method: 'POST',
    auth: true,
  });
}

export function getUnreadNotificationCount(): Promise<{ count: number }> {
  return apiRequest<{ count: number }>('/api/notifications/unread_count/', {
    auth: true,
  });
}
