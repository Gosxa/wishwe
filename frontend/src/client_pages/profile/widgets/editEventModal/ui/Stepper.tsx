'use client';

import { useState } from 'react';
import { Minus, Plus } from '@shared/ui/icons';
import s from './stepper.module.scss';

type Props = {
  label: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
};

const MAX_VALUE = 999;

export const Stepper = ({ label, value, min, onChange }: Props) => {
  const [draft, setDraft] = useState<string | null>(null);

  const clamp = (next: number) => Math.min(Math.max(next, min), MAX_VALUE);

  const currentValue = () => {
    if (draft !== null) {
      const parsed = Number.parseInt(draft, 10);

      if (!Number.isNaN(parsed)) return clamp(parsed);
    }

    return value;
  };

  const commitDraft = () => {
    if (draft === null) return;

    const parsed = Number.parseInt(draft, 10);

    if (!Number.isNaN(parsed)) onChange(clamp(parsed));

    setDraft(null);
  };

  const step = (direction: -1 | 1) => {
    const next = clamp(currentValue() + direction);

    setDraft(null);
    onChange(next);
  };

  return (
    <div className={s.stepper}>
      <span className={s.label}>{label}</span>
      <div className={s.controls}>
        <button
          type="button"
          className={s.button}
          onClick={() => step(-1)}
          disabled={currentValue() <= min}
          aria-label={`Decrease ${label}`}
        >
          <Minus />
        </button>
        <input
          type="text"
          inputMode="numeric"
          className={s.value}
          value={draft ?? String(value)}
          onChange={e =>
            setDraft(e.target.value.replace(/\D/g, '').slice(0, 3))
          }
          onBlur={commitDraft}
          onKeyDown={e => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          aria-label={label}
        />
        <button
          type="button"
          className={s.button}
          onClick={() => step(1)}
          disabled={currentValue() >= MAX_VALUE}
          aria-label={`Increase ${label}`}
        >
          <Plus />
        </button>
      </div>
    </div>
  );
};
