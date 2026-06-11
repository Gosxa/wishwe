'use client';

import { useState } from 'react';
import { SearchIcon } from '@shared/ui/icons';
import s from '../header.module.scss';

export type SearchBarProps = {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (q: string) => void;
  placeholder?: string;
};

export const SearchBar = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Search events',
}: SearchBarProps) => {
  const [localValue, setLocalValue] = useState('');

  const controlled = value !== undefined;
  const current = controlled ? value : localValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;

    if (!controlled) setLocalValue(next);
    onChange?.(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearch?.(current);
  };

  return (
    <div className={s.searchBar}>
      <SearchIcon />
      <input
        className={s.searchInput}
        type="text"
        placeholder={placeholder}
        value={current}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};
