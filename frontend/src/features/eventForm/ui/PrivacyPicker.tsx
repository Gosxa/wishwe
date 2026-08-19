'use client';

import { Asterisk } from '@shared/ui/icons';
import { HelperText } from '@shared/ui/helperText/HelperText';
import type { EventVisibility } from '../model/types';
import s from './privacyPicker.module.scss';

type Props = {
  value: EventVisibility;
  onChange: (value: EventVisibility) => void;
};

const OPTIONS: { value: EventVisibility; label: string }[] = [
  { value: 'friends-only', label: 'Friends only' },
  { value: 'f-o-f', label: 'Friends of friends' },
];

const HELPER: Record<EventVisibility, string> = {
  'friends-only': 'Only your direct friends can see and join this event',
  'f-o-f': 'Friends and friends-of-friends can see and join this event',
};

export const PrivacyPicker = ({ value, onChange }: Props) => (
  <div className={s.privacy}>
    <span className={s.label}>
      Privacy
      <Asterisk />
    </span>

    <div className={s.options}>
      {OPTIONS.map(option => (
        <label key={option.value} className={s.option}>
          <input
            type="radio"
            name="privacy"
            className={s.input}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <span className={s.radio} />
          <span className={s.optionLabel}>{option.label}</span>
        </label>
      ))}
    </div>

    <HelperText text={HELPER[value]} type="info" inline />
  </div>
);
