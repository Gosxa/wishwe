'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import clsx from 'clsx';
import { Check, Clock, Sparkles } from '@shared/ui/icons';
import {
  PLAN_CONVERSION_EXIT_MS,
  type PlanConversionState,
} from '../model/usePlanConversionTransition';
import s from './planConversionTransition.module.scss';

type Props = {
  state: Exclude<PlanConversionState, 'idle'>;
  title: string;
  date: string;
  time: string;
};

export const PlanConversionTransition = ({
  state,
  title,
  date,
  time,
}: Props) => {
  const overlay = useRef<HTMLDivElement>(null);
  const success = state === 'success' || state === 'closing';
  const scheduled = new Date(`${date}T${time}`);
  const month = scheduled.toLocaleDateString('en-US', { month: 'short' });
  const day = scheduled.getDate();
  const weekday = scheduled.toLocaleDateString('en-US', { weekday: 'long' });
  const fullDate = scheduled.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  useEffect(() => {
    const previousFocus = document.activeElement;

    overlay.current?.focus({ preventScroll: true });

    return () => {
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <div
      ref={overlay}
      className={clsx(s.overlay, success && s.success)}
      style={
        {
          '--exit-duration': `${PLAN_CONVERSION_EXIT_MS}ms`,
        } as CSSProperties
      }
      data-testid="plan-conversion-transition"
      data-state={state}
      role="dialog"
      aria-modal="true"
      aria-labelledby="planConversionHeading"
      tabIndex={-1}
      onKeyDown={event => {
        if (event.key === 'Tab' || event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <div className={s.scene} aria-hidden="true">
        <div className={s.halo} />
        <div className={s.card}>
          <div className={s.topline}>
            <span className={s.typePill}>
              <span className={s.wishLabel}>
                <Sparkles /> Wish
              </span>
              <span className={s.planLabel}>
                <Check /> Plan
              </span>
            </span>
            <span className={s.brand}>WishWe</span>
          </div>
          <strong className={s.cardTitle}>{title}</strong>
          <div className={s.schedule}>
            <span className={s.calendar}>
              <span className={s.month}>{month}</span>
              <strong>{day}</strong>
            </span>
            <span className={s.scheduleCopy}>
              <strong>{weekday}</strong>
              <span>
                <Clock /> {time}
              </span>
            </span>
            <span className={s.seal}>
              <Check />
            </span>
          </div>
        </div>
        <span className={s.sparkle}>
          <Sparkles />
        </span>
        <span className={s.caption}>
          A little less someday. A little more soon.
        </span>
      </div>
      <div
        className={s.copy}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <h2 id="planConversionHeading" className={s.heading}>
          {success ? 'Someday just got a date.' : 'Making room for your wish…'}
        </h2>
        <p className={s.body}>
          {success
            ? `It’s a plan! ${fullDate} at ${time}.`
            : 'Same wish. One step closer to happening.'}
        </p>
        <span className={s.progress} aria-hidden="true">
          <span />
        </span>
      </div>
    </div>
  );
};
