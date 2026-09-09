import type { BackendNotification } from '@/lib/api/notifications';

export type ActivityItem = {
  id: number;
  title: string;
  message: string;
  type: string;
  recipient: string;
  creator: string;
  relatedObjectType: 'event' | 'friendship';
  relatedObjectId: number;
  isRead: boolean;
  createdAt: string;
  timeAgo: string;
};

export function formatRelativeTime(
  dateInput: string | Date,
  nowInput: Date = new Date(),
): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = nowInput.getTime();
  const timestamp = date.getTime();

  if (Number.isNaN(timestamp)) {
    return '';
  }

  const diffMs = now - timestamp;

  if (diffMs < 60_000) {
    return 'just now';
  }

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(diffMs / 86_400_000);
  if (days < 7) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months === 1 ? '' : 's'} ago`;
  }

  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

export function mapNotification(
  notification: BackendNotification,
  now?: Date,
): ActivityItem {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    recipient: notification.recipient,
    creator: notification.creator,
    relatedObjectType: notification.related_object_type,
    relatedObjectId: notification.related_object_id,
    isRead: notification.is_read,
    createdAt: notification.created_at,
    timeAgo: formatRelativeTime(notification.created_at, now),
  };
}
