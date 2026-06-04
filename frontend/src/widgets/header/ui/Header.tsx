'use client';

import { useEffect, useRef, useState } from 'react';
import { BellDot, Gear, Logo } from '@shared/ui/icons';
import { logout } from '@/shared/client_api/auth';
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
};

export const Header = ({ search }: Props) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

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
      <SearchBar {...search} />
      <CreateButton />
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
                    onClick={item.label === 'Log out' ? logout : undefined}
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
