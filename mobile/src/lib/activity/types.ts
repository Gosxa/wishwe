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

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

const UNITS: [label: string, duration: number][] = [
  ['year', YEAR],
  ['month', MONTH],
  ['week', WEEK],
  ['day', DAY],
  ['hour', HOUR],
  ['minute', MINUTE],
];

export function formatRelativeTime(
  dateInput: string | Date,
  nowInput: Date = new Date(),
): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const timestamp = date.getTime();

  if (Number.isNaN(timestamp)) {
    return '';
  }

  const diffMs = nowInput.getTime() - timestamp;

  if (diffMs < MINUTE) {
    return 'just now';
  }

  const unit = UNITS.find(([, duration]) => diffMs >= duration);

  if (!unit) {
    return 'just now';
  }

  const [label, duration] = unit;
  const value = Math.floor(diffMs / duration);

  return `${value} ${label}${value === 1 ? '' : 's'} ago`;
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
