'use client';

import { useEffect } from 'react';
import clsx from 'clsx';
import { Asterisk, BadgeInfo, CalendarClock, Clock, X } from '@shared/ui/icons';
import { TextInput } from '@shared/ui/textInput/TextInput';
import { TextArea } from '@shared/ui/textArea/TextArea';
import { HelperText } from '@shared/ui/helperText/HelperText';
import { Toggle } from '@shared/ui/toggle/Toggle';
import type { BackendEvent } from '@/shared/client_api/event';
import { useBodyScrollLock } from '@/features';
import { toAbsoluteMediaUrl } from '@client_pages/home/model/feedMapper';
import { CategoryPicker } from '@shared/ui/categoryPicker/CategoryPicker';
import { CoverUpload } from '@shared/ui/coverUpload/CoverUpload';
import { Stepper } from '@shared/ui/stepper/Stepper';
import { usePlanIt } from '../model/usePlanIt';
import s from './planItModal.module.scss';

type Props = {
  event: BackendEvent;
  onClose: () => void;
  onConverted: () => void;
};

const noop = () => {};

export const PlanItModal = ({ event, onClose, onConverted }: Props) => {
  const { category, when, participants, submit } = usePlanIt(
    event,
    onConverted,
  );

  const coverPreviewUrl = toAbsoluteMediaUrl(event.cover_image);

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
            <fieldset className={s.readonly} disabled>
              <CoverUpload
                previewUrl={coverPreviewUrl}
                isUploading={false}
                onSelect={noop}
              />
            </fieldset>
          </div>
        </div>

        <div className={s.right}>
          <h2 id="planItTitle" className={s.title}>
            Create a plan
          </h2>

          <div className={s.fields}>
            <fieldset className={s.readonly} disabled>
              <CategoryPicker
                categories={category.options}
                selected={category.selected}
                onChange={noop}
              />

              <TextInput
                id="planTitle"
                label="What's the plan?"
                placeholder="Movie night under the stars"
                required
                value={event.title}
                onChange={noop}
                helperText="Up to 50 characters"
                maxLength={50}
                showCounter
              />

              <TextInput
                id="planLocation"
                label="Where?"
                placeholder="Add a location"
                required
                value={event.location}
                onChange={noop}
              />

              <TextArea
                id="planDescription"
                label="Description"
                placeholder="Add details"
                value={event.description}
                onChange={noop}
                helperText="Up to 200 characters"
                maxLength={200}
                showCounter
              />
            </fieldset>

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
                <fieldset
                  className={s.maxField}
                  disabled={participants.unlimited}
                >
                  <Stepper
                    label="Max"
                    value={participants.max}
                    min={2}
                    onChange={participants.onMaxChange}
                  />
                </fieldset>
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
