'use client';

import { useRouter } from 'next/navigation';
import { useNotifications } from '../model/useNotifications';
import { NotificationsDropdown } from './NotificationsDropdown';

export const ActivityFeed = () => {
  const router = useRouter();
  const { notifications, isLoading, error, retry, removeNotification } =
    useNotifications(true);

  return (
    <NotificationsDropdown
      id="activity"
      titleId="activity-title"
      presentation="page"
      notifications={notifications}
      isLoading={isLoading}
      error={error}
      onRetry={retry}
      onDelete={id => void removeNotification(id)}
      onEventClick={id => router.push(`/feed?event=${id}`)}
      onUserClick={username =>
        router.push(
          `/user/${encodeURIComponent(username.replace(/^@/, '').trim())}`,
        )
      }
    />
  );
};
