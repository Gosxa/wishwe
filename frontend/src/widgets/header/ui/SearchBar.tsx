'use client';

import { useState } from 'react';
import { SearchIcon } from '@shared/ui/icons';
import s from '../header.module.scss';

export type SearchBarProps = {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (q: string) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledHint?: string;
};

export const SearchBar = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Search events',
  disabled = false,
  disabledHint,
}: SearchBarProps) => {
  const [localValue, setLocalValue] = useState('');

  const controlled = value !== undefined;
  const current = controlled ? value : localValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const next = e.target.value;

    if (!controlled) setLocalValue(next);
    onChange?.(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || e.key !== 'Enter') return;

    onSearch?.(current);
  };

  const showHint = disabled && !!disabledHint;

  return (
    <div className={s.searchBarWrap}>
      <div
        className={
          disabled ? `${s.searchBar} ${s.searchBarDisabled}` : s.searchBar
        }
      >
        <SearchIcon />
        <input
          className={s.searchInput}
          type="text"
          placeholder={placeholder}
          value={current}
          disabled={disabled}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
      </div>
      {showHint && (
        <span
          id="search-disabled-hint"
          role="tooltip"
          className={s.searchTooltip}
        >
          {disabledHint}
        </span>
      )}
    </div>
  );
};
