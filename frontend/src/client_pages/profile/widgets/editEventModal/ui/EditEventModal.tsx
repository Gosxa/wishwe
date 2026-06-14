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
import { CategoryPicker } from '@shared/ui/categoryPicker/CategoryPicker';
import { CoverUpload } from '@shared/ui/coverUpload/CoverUpload';
import { Stepper } from '@shared/ui/stepper/Stepper';
import { useEditEvent } from '../model/useEditEvent';
import s from './editEventModal.module.scss';

type Props = {
  event: BackendEvent;
  onClose: () => void;
  onSaved: () => void;
};

export const EditEventModal = ({ event, onClose, onSaved }: Props) => {
  const {
    isPlan,
    category,
    titleInput,
    locationInput,
    descriptionInput,
    dateInput,
    timeInput,
    participants,
    timeframeInput,
    cover,
    submit,
  } = useEditEvent(event, onSaved);

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
        aria-labelledby="editEventTitle"
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
          {/* Display-only */}
          <div className={s.typeBlock}>
            <div className={s.typePills}>
              <span className={clsx(s.typePill, isPlan && s.typePillActive)}>
                Plan
              </span>
              <span className={clsx(s.typePill, !isPlan && s.typePillActive)}>
                Wish
              </span>
            </div>
            <span className={s.typeHint}>
              <BadgeInfo />
              {isPlan
                ? 'Scheduled event with a fixed date.'
                : 'An idea for the future without a specific time.'}
            </span>
          </div>

          <div className={s.coverSlot}>
            <CoverUpload
              previewUrl={cover.previewUrl}
              isUploading={submit.isSubmitting}
              onSelect={cover.onSelect}
              error={cover.error}
            />
          </div>
        </div>

        <div className={s.right}>
          <h2 id="editEventTitle" className={s.title}>
            {isPlan ? 'Edit a plan' : 'Edit a wish'}
          </h2>

          <div className={s.fields}>
            <CategoryPicker
              categories={category.options}
              selected={category.selected}
              onChange={category.onChange}
              error={category.error}
            />

            <TextInput
              id="eventTitle"
              label={isPlan ? "What's the plan?" : "What's your wish?"}
              placeholder={
                isPlan ? 'Rooftop sunset cocktails' : 'Board games night'
              }
              required
              value={titleInput.value}
              onChange={e => titleInput.onChange(e.target.value)}
              helperText="Up to 50 characters"
              error={titleInput.error}
              maxLength={50}
              showCounter
            />

            <TextInput
              id="eventLocation"
              label="Where?"
              placeholder="Add a location"
              required
              value={locationInput.value}
              onChange={e => locationInput.onChange(e.target.value)}
              error={locationInput.error}
            />

            <TextArea
              id="eventDescription"
              label="Description"
              placeholder="Add details"
              value={descriptionInput.value}
              onChange={e => descriptionInput.onChange(e.target.value)}
              helperText="Up to 200 characters"
              error={descriptionInput.error}
              maxLength={200}
              showCounter
            />

            {isPlan ? (
              <>
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
                          dateInput.error && s.inputError,
                        )}
                        value={dateInput.value}
                        onChange={e => dateInput.onChange(e.target.value)}
                        aria-label="Event date"
                      />
                      <CalendarClock />
                    </div>
                    <div
                      className={clsx(s.dateTimeWrapper, s.dateTimeWrapperTime)}
                    >
                      <input
                        type="time"
                        className={clsx(
                          s.dateTimeInput,
                          timeInput.error && s.inputError,
                        )}
                        value={timeInput.value}
                        onChange={e => timeInput.onChange(e.target.value)}
                        aria-label="Event time"
                      />
                      <Clock />
                    </div>
                  </div>
                  {(dateInput.error ?? timeInput.error) && (
                    <HelperText
                      text={(dateInput.error ?? timeInput.error) as string}
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
                          id="editPlanUnlimited"
                          checked={participants.unlimited}
                          onChange={participants.onUnlimitedChange}
                        />
                      </div>
                    </div>
                  </div>
                  {(participants.minError ?? participants.maxError) && (
                    <HelperText
                      text={
                        (participants.minError ??
                          participants.maxError) as string
                      }
                      type="error"
                      inline
                    />
                  )}
                </div>
              </>
            ) : (
              <>
                <TextInput
                  id="eventTimeframe"
                  label="Timeframe"
                  placeholder="Next weekend or sometime in June"
                  required
                  value={timeframeInput.value}
                  onChange={e => timeframeInput.onChange(e.target.value)}
                  error={timeframeInput.error}
                />

                <div className={s.field}>
                  <span className={s.label}>How many friends do you need?</span>
                  <Stepper
                    label="Min"
                    value={participants.min}
                    min={1}
                    onChange={participants.onMinChange}
                  />
                  {participants.minError && (
                    <HelperText
                      text={participants.minError}
                      type="error"
                      inline
                    />
                  )}
                </div>
              </>
            )}

            {submit.error && (
              <HelperText text={submit.error} type="error" inline />
            )}
          </div>

          <button
            type="button"
            className={s.save}
            onClick={submit.onSubmit}
            disabled={submit.isSubmitting}
          >
            <span>Save changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
