'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BellDot, ExternalLink, Gear, Logo } from '@shared/ui/icons';
import { logout } from '@/shared/client_api/auth';
import { TERMS_OF_USE_URL } from '@/shared/lib/legal';
import { useEventsRefreshStore } from '@/shared/store/useEventsRefreshStore';
import { useCreateEventStore } from '@/shared/store/useCreateEventStore';
import type { NotificationItem } from '@/shared/client_api/notifications';
import { CreateEventModal } from '@widgets/createEventModal';
import { SearchBar, type SearchBarProps } from './SearchBar';
import { CreateButton } from './CreateButton';
import { NotificationsDropdown } from './NotificationsDropdown';
import { useNotifications } from '../model/useNotifications';
import s from '../header.module.scss';

const settingsItems = [
  { label: 'Edit profile' },
  { label: 'Support' },
  { label: 'Terms of Use', external: true },
  { label: 'Log out', variant: 'danger' },
] as const;

type Props = {
  search?: SearchBarProps;
  showSearch?: boolean;
  mobileFeedLayout?: boolean;
};

export const Header = ({
  search,
  showSearch = true,
  mobileFeedLayout = false,
}: Props) => {
  const router = useRouter();
  const requestRefresh = useEventsRefreshStore(state => state.requestRefresh);
  const isCreateOpen = useCreateEventStore(state => state.isOpen);
  const createDefaultType = useCreateEventStore(state => state.defaultType);
  const openCreate = useCreateEventStore(state => state.open);
  const closeCreate = useCreateEventStore(state => state.close);
  const [openMenu, setOpenMenu] = useState<'notifications' | 'settings' | null>(
    null,
  );
  const actionsRef = useRef<HTMLDivElement>(null);
  const toastTimersRef = useRef(
    new Map<
      number,
      {
        start?: ReturnType<typeof setTimeout>;
        finish?: ReturnType<typeof setTimeout>;
      }
    >(),
  );
  const [toasts, setToasts] = useState<NotificationItem[]>([]);
  const toastsRef = useRef(toasts);
  const [fadingToasts, setFadingToasts] = useState<Set<number>>(new Set());
  const isNotificationsOpen = openMenu === 'notifications';
  const isSettingsOpen = openMenu === 'settings';
  const {
    unreadCount,
    notifications,
    isLoading: areNotificationsLoading,
    error: notificationsError,
    retry: retryNotifications,
    removeNotification,
  } = useNotifications(isNotificationsOpen);

  const clearToastTimers = useCallback((id: number) => {
    const timers = toastTimersRef.current.get(id);
    if (timers?.start) clearTimeout(timers.start);
    if (timers?.finish) clearTimeout(timers.finish);
    toastTimersRef.current.delete(id);
  }, []);

  const dismissToast = useCallback((id: number) => {
    clearToastTimers(id);
    toastsRef.current = toastsRef.current.filter(item => item.id !== id);
    setToasts(toastsRef.current);
    setFadingToasts(current => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }, [clearToastTimers]);

  const scheduleToastDismiss = useCallback((id: number) => {
    clearToastTimers(id);
    if (document.visibilityState !== 'visible') return;

    const start = setTimeout(() => {
      setFadingToasts(current => new Set(current).add(id));
      const finish = setTimeout(() => dismissToast(id), 2000);
      toastTimersRef.current.set(id, { finish });
    }, 2000);
    toastTimersRef.current.set(id, { start });
  }, [clearToastTimers, dismissToast]);

  useEffect(() => {
    toastsRef.current = toasts;
  }, [toasts]);

  useEffect(() => {
    const handleNotification = (event: Event) => {
      const notification = (event as CustomEvent<NotificationItem>).detail;
      const next = [
        notification,
        ...toastsRef.current.filter(item => item.id !== notification.id),
      ].slice(0, 4);
      toastsRef.current = next;
      setToasts(next);
      scheduleToastDismiss(notification.id);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        toastTimersRef.current.forEach(timers => {
          if (timers.start) clearTimeout(timers.start);
          if (timers.finish) clearTimeout(timers.finish);
        });
        toastTimersRef.current.clear();
        setFadingToasts(new Set());
        return;
      }

      toastsRef.current.forEach(notification =>
        scheduleToastDismiss(notification.id),
      );
    };

    window.addEventListener('wishwe:notification', handleNotification);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('wishwe:notification', handleNotification);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      toastTimersRef.current.forEach(timers => {
        if (timers.start) clearTimeout(timers.start);
        if (timers.finish) clearTimeout(timers.finish);
      });
      toastTimersRef.current.clear();
    };
  }, [scheduleToastDismiss]);

  const closeToast = (id: number) => {
    dismissToast(id);
  };

  const pauseToast = (id: number) => {
    clearToastTimers(id);
    setFadingToasts(current => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  const settingsActions: Partial<Record<string, () => void>> = {
    'Log out': logout,
    'Edit profile': () => {
      setOpenMenu(null);
      router.push('/edit-profile');
    },
    Support: () => {
      setOpenMenu(null);
      window.location.href = 'mailto:support@wishwe.online';
    },
    'Terms of Use': () => {
      setOpenMenu(null);
      window.open(TERMS_OF_USE_URL, '_blank', 'noopener,noreferrer');
    },
  };

  useEffect(() => {
    if (!openMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!actionsRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenu]);

  return (
    <header
      className={
        mobileFeedLayout ? `${s.header} ${s.mobileFeedLayout}` : s.header
      }
      data-mobile-feed-layout={mobileFeedLayout ? '' : undefined}
    >
      <div className={s.logoSlot}>
        <Logo height={36} />
      </div>
      {showSearch && <SearchBar {...search} />}
      <CreateButton onClick={() => openCreate()} />
      {isCreateOpen && (
        <CreateEventModal
          defaultType={createDefaultType}
          onClose={closeCreate}
          onCreated={() => {
            closeCreate();
            requestRefresh();
          }}
        />
      )}
      <div className={s.actions} ref={actionsRef}>
        <div className={s.notifications}>
          <button
            data-tour="notifications"
            className={`${s.iconBtn} ${
              isNotificationsOpen ? s.iconBtnActive : ''
            }`}
            type="button"
            aria-label={`Notifications${
              unreadCount > 0 ? `, ${unreadCount} unread` : ''
            }`}
            onClick={() =>
              setOpenMenu(current =>
                current === 'notifications' ? null : 'notifications',
              )
            }
          >
            <BellDot hasUnread={unreadCount > 0} />
          </button>
          {isNotificationsOpen && (
            <NotificationsDropdown
              id="notifications-menu"
              titleId="notifications-title"
              notifications={notifications}
              isLoading={areNotificationsLoading}
              error={notificationsError}
              onRetry={retryNotifications}
              onDelete={id => void removeNotification(id)}
              onEventClick={eventId => {
                setOpenMenu(null);
                router.push(`/feed?event=${encodeURIComponent(eventId)}`);
              }}
              onUserClick={username => {
                setOpenMenu(null);
                const handle = username.replace(/^@/, '').trim();

                router.push(`/user/${encodeURIComponent(handle)}`);
              }}
            />
          )}
        </div>
        <div className={s.settings}>
          <button
            className={`${s.iconBtn} ${isSettingsOpen ? s.iconBtnActive : ''}`}
            type="button"
            onClick={() =>
              setOpenMenu(current =>
                current === 'settings' ? null : 'settings',
              )
            }
          >
            <Gear />
          </button>
          {isSettingsOpen && (
            <div id="settings-menu" className={s.settingsMenu} role="region">
              <h2 id="settings-title" className={s.settingsTitle}>
                Settings
              </h2>
              <div className={s.settingsList}>
                {settingsItems.map(item => (
                  <button
                    key={item.label}
                    type="button"
                    className={
                      'variant' in item && item.variant === 'danger'
                        ? `${s.settingsItem} ${s.danger}`
                        : s.settingsItem
                    }
                    onClick={settingsActions[item.label]}
                  >
                    <span>{item.label}</span>
                    {'external' in item && item.external && <ExternalLink />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className={s.notificationToasts} aria-live="polite">
        {toasts.map(notification => (
          <article
            className={`${s.notificationToast} ${
              fadingToasts.has(notification.id)
                ? s.notificationToastFading
                : ''
            }`}
            key={notification.id}
            role="status"
            onMouseEnter={() => pauseToast(notification.id)}
            onMouseLeave={() => scheduleToastDismiss(notification.id)}
          >
            <div>
              <p className={s.notificationToastTitle}>{notification.title}</p>
              <p className={s.notificationToastMessage}>
                {notification.message}
              </p>
            </div>
            <button
              className={s.closeNotificationToast}
              type="button"
              aria-label="Close notification"
              onClick={() => closeToast(notification.id)}
            >
              ×
            </button>
          </article>
        ))}
      </div>
    </header>
  );
};
