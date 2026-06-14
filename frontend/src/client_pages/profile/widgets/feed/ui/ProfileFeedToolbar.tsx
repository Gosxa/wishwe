'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { ChevronDown } from '@shared/ui/icons';
import type {
  ProfileSort,
  ProfileTab,
} from '@client_pages/profile/model/types';
import s from '@client_pages/home/widgets/feed/ui/feedToolbar.module.scss';

type Props = {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  activeSort: ProfileSort;
  onSortChange: (sort: ProfileSort) => void;
};

const tabs: { key: ProfileTab; label: string }[] = [
  { key: 'plans', label: 'Plans' },
  { key: 'wishes', label: 'Wishes' },
  { key: 'archive', label: 'Archive' },
];

const sortOptions: { key: ProfileSort; label: string }[] = [
  { key: 'recent', label: 'recently added' },
  { key: 'soonest', label: 'soonest first' },
];

type DropdownProps<T extends string> = {
  label: string;
  value: T;
  options: { key: T; label: string }[];
  onChange: (value: T) => void;
};

const Dropdown = <T extends string>({
  label,
  value,
  options,
  onChange,
}: DropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activeLabel = options.find(option => option.key === value)?.label;

  const handleSelect = (key: T) => {
    onChange(key);
    setIsOpen(false);
  };

  return (
    <div className={s.dropdown} ref={rootRef}>
      <button
        type="button"
        className={s.control}
        onClick={() => setIsOpen(current => !current)}
      >
        <span className={s.controlLabel}>{label}</span>
        <span className={s.controlValue}>{activeLabel}</span>
        <ChevronDown />
      </button>

      {isOpen && (
        <div className={s.menu}>
          {options.map(option => (
            <button
              key={option.key}
              type="button"
              className={clsx(
                s.menuItem,
                option.key === value && s.menuItemActive,
              )}
              onClick={() => handleSelect(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const ProfileFeedToolbar = ({
  activeTab,
  onTabChange,
  activeSort,
  onSortChange,
}: Props) => (
  <div className={s.toolbar}>
    <div className={s.filters}>
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={clsx(s.filter, key === activeTab && s.active)}
          onClick={() => onTabChange(key)}
        >
          {label}
        </button>
      ))}
    </div>

    <div className={s.controls}>
      <Dropdown
        label="Sort:"
        value={activeSort}
        options={sortOptions}
        onChange={onSortChange}
      />
    </div>
  </div>
);
