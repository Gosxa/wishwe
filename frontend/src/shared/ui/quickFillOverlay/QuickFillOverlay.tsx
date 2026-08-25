'use client';

import type { CSSProperties } from 'react';
import clsx from 'clsx';
import {
  QUICK_FILL_STAGGER_MS,
  QUICK_FILL_WORD_MS,
} from '@/shared/lib/quickFill';
import s from './quickFillOverlay.module.scss';

type Props = {
  words: string[];
  className: string;
};

export const QuickFillOverlay = ({ words, className }: Props) => (
  <span
    aria-hidden
    className={clsx(s.overlay, className)}
    style={{ '--qf-duration': `${QUICK_FILL_WORD_MS}ms` } as CSSProperties}
  >
    {words.map((word, index) => (
      <span
        key={`${index}-${word}`}
        className={s.word}
        style={
          {
            '--qf-delay': `${index * QUICK_FILL_STAGGER_MS}ms`,
          } as CSSProperties
        }
      >
        {word}
      </span>
    ))}
  </span>
);
