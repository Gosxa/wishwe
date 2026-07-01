import clsx from 'clsx';
import type { NotificationItem } from '@/shared/client_api/notifications';
import s from '../header.module.scss';

type Props = {
  id: string;
  titleId: string;
  notifications: NotificationItem[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onEventClick: (eventId: number) => void;
  onUserClick: (username: string) => void;
};

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'always' });

const formatRelativeTime = (date: string) => {
  const difference = new Date(date).getTime() - Date.now();
  const absoluteDifference = Math.abs(difference);

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 365 * 24 * 60 * 60 * 1000],
    ['month', 30 * 24 * 60 * 60 * 1000],
    ['week', 7 * 24 * 60 * 60 * 1000],
    ['day', 24 * 60 * 60 * 1000],
    ['hour', 60 * 60 * 1000],
    ['minute', 60 * 1000],
    ['second', 1000],
  ];

  const [unit, duration] =
    units.find(([, unitDuration]) => absoluteDifference >= unitDuration) ??
    units[units.length - 1];

  return relativeTime.format(Math.trunc(difference / duration), unit);
};

export const NotificationsDropdown = ({
  id,
  titleId,
  notifications,
  isLoading,
  error,
  onRetry,
  onEventClick,
  onUserClick,
}: Props) => (
  <section
    id={id}
    className={s.notificationsMenu}
    role="region"
    aria-labelledby={titleId}
  >
    <h2 id={titleId} className={s.notificationsTitle}>
      Notifications
    </h2>

    <div className={s.notificationsContent} aria-live="polite">
      {isLoading && notifications.length === 0 && (
        <p className={s.notificationsState} role="status">
          Loading notifications…
        </p>
      )}

      {error && (
        <div className={s.notificationsError} role="alert">
          <p>{error}</p>
          <button type="button" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}

      {!isLoading && !error && notifications.length === 0 && (
        <p className={s.notificationsState}>No notifications yet.</p>
      )}

      {notifications.length > 0 && (
        <div className={s.notificationsList}>
          {notifications.map(notification => {
            const body = (
              <>
                <p>{notification.message}</p>
                <time
                  dateTime={notification.created_at}
                  title={new Date(notification.created_at).toLocaleString()}
                >
                  {formatRelativeTime(notification.created_at)}
                </time>
              </>
            );

            if (notification.related_object_type === 'event') {
              return (
                <button
                  key={notification.id}
                  type="button"
                  className={clsx(s.notificationItem, s.notificationItemButton)}
                  onClick={() => onEventClick(notification.related_object_id)}
                >
                  {body}
                </button>
              );
            }

            if (
              notification.related_object_type === 'friendship' &&
              notification.creator
            ) {
              return (
                <button
                  key={notification.id}
                  type="button"
                  className={clsx(s.notificationItem, s.notificationItemButton)}
                  onClick={() => onUserClick(notification.creator)}
                >
                  {body}
                </button>
              );
            }

            return (
              <article key={notification.id} className={s.notificationItem}>
                {body}
              </article>
            );
          })}
        </div>
      )}
    </div>
  </section>
);
