'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BellDot, Gear, Logo } from '@shared/ui/icons';
import { logout } from '@/shared/client_api/auth';
import { useEventsRefreshStore } from '@/shared/store/useEventsRefreshStore';
import { useCreateEventStore } from '@/shared/store/useCreateEventStore';
import { CreateEventModal } from '@widgets/createEventModal';
import { SearchBar, type SearchBarProps } from './SearchBar';
import { CreateButton } from './CreateButton';
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const settingsActions: Partial<Record<string, () => void>> = {
    'Log out': logout,
    'Edit profile': () => {
      setIsSettingsOpen(false);
      router.push('/edit-profile');
    },
  };

  useEffect(() => {
    if (!isSettingsOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!settingsRef.current?.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSettingsOpen]);

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
      <div className={s.actions}>
        <button className={s.iconBtn}>
          <BellDot />
        </button>
        <div className={s.settings} ref={settingsRef}>
          <button
            className={s.iconBtn}
            type="button"
            onClick={() => setIsSettingsOpen(current => !current)}
          >
            <Gear />
          </button>
          {isSettingsOpen && (
            <div id="settings-menu" className={s.settingsMenu}>
              <h2 className={s.settingsTitle}>Settings</h2>
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
