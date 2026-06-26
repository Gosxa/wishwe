'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BellDot, Gear, Logo } from '@shared/ui/icons';
import { logout } from '@/shared/client_api/auth';
import { useEventsRefreshStore } from '@/shared/store/useEventsRefreshStore';
import { useCreateEventStore } from '@/shared/store/useCreateEventStore';
import { useEventModalStore } from '@/shared/store/useEventModalStore';
import { CreateEventModal } from '@widgets/createEventModal';
import { SearchBar, type SearchBarProps } from './SearchBar';
import { CreateButton } from './CreateButton';
import { NotificationsDropdown } from './NotificationsDropdown';
import { useNotifications } from '../model/useNotifications';
import s from '../header.module.scss';

const settingsItems = [
  { label: 'Edit profile' },
  { label: 'Support' },
  { label: 'Log out', variant: 'danger' },
] as const;

type Props = {
  search?: SearchBarProps;
  showSearch?: boolean;
};

export const Header = ({ search, showSearch = true }: Props) => {
  const router = useRouter();
  const requestRefresh = useEventsRefreshStore(state => state.requestRefresh);
  const isCreateOpen = useCreateEventStore(state => state.isOpen);
  const createDefaultType = useCreateEventStore(state => state.defaultType);
  const openCreate = useCreateEventStore(state => state.open);
  const closeCreate = useCreateEventStore(state => state.close);
  const openEventModal = useEventModalStore(state => state.open);
  const [openMenu, setOpenMenu] = useState<'notifications' | 'settings' | null>(
    null,
  );
  const actionsRef = useRef<HTMLDivElement>(null);
  const isNotificationsOpen = openMenu === 'notifications';
  const isSettingsOpen = openMenu === 'settings';
  const {
    unreadCount,
    notifications,
    isLoading: areNotificationsLoading,
    error: notificationsError,
    retry: retryNotifications,
  } = useNotifications(isNotificationsOpen);

  const settingsActions: Partial<Record<string, () => void>> = {
    'Log out': logout,
    'Edit profile': () => {
      setOpenMenu(null);
      router.push('/edit-profile');
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
    <header className={s.header}>
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
              onEventClick={eventId => {
                setOpenMenu(null);
                openEventModal(String(eventId));
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
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
