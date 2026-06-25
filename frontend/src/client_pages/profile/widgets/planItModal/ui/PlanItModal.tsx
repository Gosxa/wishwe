'use client';

import { useEffect } from 'react';
import clsx from 'clsx';
import { Asterisk, BadgeInfo, CalendarClock, Clock, X } from '@shared/ui/icons';
import { HelperText } from '@shared/ui/helperText/HelperText';
import { Toggle } from '@shared/ui/toggle/Toggle';
import type { BackendEvent } from '@/shared/client_api/event';
import { useBodyScrollLock } from '@/features';
import { toAbsoluteMediaUrl } from '@client_pages/home/model/feedMapper';
import { Stepper } from '@shared/ui/stepper/Stepper';
import { usePlanIt } from '../model/usePlanIt';
import s from './planItModal.module.scss';

type Props = {
  event: BackendEvent;
  onClose: () => void;
  onConverted: () => void;
};

const FALLBACK_COVER = '/bg-gradient-noise.webp';

export const PlanItModal = ({ event, onClose, onConverted }: Props) => {
  const { when, participants, submit } = usePlanIt(event, onConverted);

  const coverPreviewUrl =
    toAbsoluteMediaUrl(event.cover_image) ?? FALLBACK_COVER;

  useBodyScrollLock();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submit.isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, submit.isSubmitting]);

  return (
    <div className={s.overlay}>
      <div
        className={s.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="planItTitle"
      >
        <button
          type="button"
          className={s.close}
          onClick={onClose}
          aria-label="Close"
        >
          <X />
        </button>

        <div className={s.left}>
          <div className={s.typeBlock}>
            <div className={s.typePills}>
              <span className={clsx(s.typePill, s.typePillActive)}>Plan</span>
              <span className={s.typePill}>Wish</span>
            </div>
            <span className={s.typeHint}>
              <BadgeInfo />
              Scheduled event with a fixed date.
            </span>
          </div>

          <div className={s.coverSlot}>
            <span className={s.label}>Cover</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={s.cover} src={coverPreviewUrl} alt="Event cover" />
          </div>
        </div>

        <div className={s.right}>
          <h2 id="planItTitle" className={s.title}>
            Create a plan
          </h2>

          <div className={s.fields}>
            <div className={s.field}>
              <span className={s.label}>What?</span>
              <p className={s.readOnlyValue}>{event.title}</p>
            </div>

            <div className={s.field}>
              <span className={s.label}>
                When?
                <Asterisk />
              </span>
              <div className={s.whenRow}>
                <div className={s.dateTimeWrapper}>
                  <input
                    type="date"
                    className={clsx(
                      s.dateTimeInput,
                      when.dateError && s.inputError,
                    )}
                    value={when.date}
                    min={when.minDate}
                    onChange={e => when.onDateChange(e.target.value)}
                    aria-label="Event date"
                  />
                  <CalendarClock />
                </div>
                <div className={clsx(s.dateTimeWrapper, s.dateTimeWrapperTime)}>
                  <input
                    type="time"
                    className={clsx(
                      s.dateTimeInput,
                      when.timeError && s.inputError,
                    )}
                    value={when.time}
                    min={when.minTime}
                    onChange={e => when.onTimeChange(e.target.value)}
                    aria-label="Event time"
                  />
                  <Clock />
                </div>
              </div>
              {(when.dateError ?? when.timeError) && (
                <HelperText
                  text={(when.dateError ?? when.timeError) as string}
                  type="error"
                  inline
                />
              )}
            </div>

            <div className={s.field}>
              <span className={s.label}>
                How many people can join?
                <Asterisk />
              </span>
              <div className={s.steppers}>
                <Stepper
                  label="Min"
                  value={participants.min}
                  min={1}
                  onChange={participants.onMinChange}
                />
                {!participants.unlimited && (
                  <fieldset className={s.maxField}>
                    <Stepper
                      label="Max"
                      value={participants.max}
                      min={2}
                      onChange={participants.onMaxChange}
                    />
                  </fieldset>
                )}
                <div className={s.unlimited}>
                  <span className={s.unlimitedLabel}>Unlimited</span>
                  <div className={s.unlimitedControl}>
                    <Toggle
                      id="planUnlimited"
                      checked={participants.unlimited}
                      onChange={participants.onUnlimitedChange}
                    />
                  </div>
                </div>
              </div>
              {participants.maxError && (
                <HelperText text={participants.maxError} type="error" inline />
              )}
            </div>

            {submit.error && (
              <HelperText text={submit.error} type="error" inline />
            )}
          </div>

          <button
            type="button"
            className={s.share}
            onClick={submit.onSubmit}
            disabled={submit.isSubmitting}
          >
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};
