'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { ChevronDown } from '@shared/ui/icons';
import s from './eventFeedToolbar.module.scss';

export type EventFeedOption<Value extends string> = {
  key: Value;
  label: string;
};

type ToolbarProps<Value extends string> = {
  options: EventFeedOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  controls: ReactNode;
  tourId?: string;
};

export const EventFeedToolbar = <Value extends string>({
  options,
  value,
  onChange,
  controls,
  tourId,
}: ToolbarProps<Value>) => (
  <div className={s.toolbar} data-tour={tourId}>
    <div className={s.filters}>
      {options.map(option => (
        <button
          key={option.key}
          type="button"
          className={clsx(s.filter, option.key === value && s.active)}
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>

    <div className={s.controls}>{controls}</div>
  </div>
);

type DropdownProps<Value extends string> = {
  label: string;
  value: Value;
  options: EventFeedOption<Value>[];
  onChange: (value: Value) => void;
};

export const EventFeedDropdown = <Value extends string>({
  label,
  value,
  options,
  onChange,
}: DropdownProps<Value>) => {
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

  const handleSelect = (key: Value) => {
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
