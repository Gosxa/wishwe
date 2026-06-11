'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { ChevronDown } from '@shared/ui/icons';
import type {
  FeedFilter,
  FeedReach,
  SortOption,
} from '@client_pages/home/model/types';
import s from './feedToolbar.module.scss';

type Props = {
  activeFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
  activeReach: FeedReach;
  onReachChange: (reach: FeedReach) => void;
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
};

const filters: { key: FeedFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'plans', label: 'Plans' },
  { key: 'wishes', label: 'Wishes' },
];

const reachOptions: { key: FeedReach; label: string }[] = [
  { key: 'all', label: 'All updates' },
  { key: 'direct', label: 'Only direct friends' },
];

const sortOptions: { key: SortOption; label: string }[] = [
  { key: 'soonest', label: 'soonest first' },
  { key: 'recent', label: 'recently added' },
  { key: 'heat', label: 'social heat' },
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

export const FeedToolbar = ({
  activeFilter,
  onFilterChange,
  activeReach,
  onReachChange,
  activeSort,
  onSortChange,
}: Props) => (
  <div className={s.toolbar}>
    <div className={s.filters}>
      {filters.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={clsx(s.filter, key === activeFilter && s.active)}
          onClick={() => onFilterChange(key)}
        >
          {label}
        </button>
      ))}
    </div>

    <div className={s.controls}>
      <Dropdown
        label="Show:"
        value={activeReach}
        options={reachOptions}
        onChange={onReachChange}
      />
      <Dropdown
        label="Sort:"
        value={activeSort}
        options={sortOptions}
        onChange={onSortChange}
      />
    </div>
  </div>
);
