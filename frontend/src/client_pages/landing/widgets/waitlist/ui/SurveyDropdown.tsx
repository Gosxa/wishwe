'use client';

import clsx from 'clsx';
import { useEffect, useId, useRef, useState } from 'react';

import { ChevronDown } from '@shared/ui/icons';

import s from './surveyDropdown.module.scss';

type Props = {
  label: string;
  placeholder: string;
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
};

export const SurveyDropdown = ({
  label,
  placeholder,
  options,
  value,
  onChange,
}: Props) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleSelect = (option: string) => {
    onChange(option);
    setOpen(false);
  };

  return (
    <div className={s.field} ref={rootRef}>
      <span className={s.label} id={labelId}>
        {label}
      </span>

      <div className={s.control}>
        <button
          type="button"
          className={clsx(s.trigger, value && s.triggerFilled)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={labelId}
          onClick={() => setOpen(prev => !prev)}
        >
          <span className={clsx(s.value, !value && s.placeholder)}>
            {value ?? placeholder}
          </span>
          <span className={clsx(s.chevron, open && s.chevronOpen)}>
            <ChevronDown />
          </span>
        </button>

        {open && (
          <ul className={s.panel} role="listbox" aria-labelledby={labelId}>
            {options.map(option => {
              const selected = option === value;

              return (
                <li key={option}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={clsx(s.option, selected && s.optionSelected)}
                    onClick={() => handleSelect(option)}
                  >
                    {option}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
