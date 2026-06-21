'use client';

import { useEffect } from 'react';
import clsx from 'clsx';
import { Asterisk, BadgeInfo, CalendarClock, Clock, X } from '@shared/ui/icons';
import { TextInput } from '@shared/ui/textInput/TextInput';
import { TextArea } from '@shared/ui/textArea/TextArea';
import { HelperText } from '@shared/ui/helperText/HelperText';
import { Toggle } from '@shared/ui/toggle/Toggle';
import { CategoryPicker } from '@shared/ui/categoryPicker/CategoryPicker';
import { CoverUpload } from '@shared/ui/coverUpload/CoverUpload';
import { Stepper } from '@shared/ui/stepper/Stepper';
import type { BackendEventType } from '@/shared/client_api/event';
import { useBodyScrollLock } from '@/features';
import { useCreateEvent } from '../model/useCreateEvent';
import { PrivacyPicker } from './PrivacyPicker';
import s from './createEventModal.module.scss';

type Props = {
  onClose: () => void;
  onCreated: () => void;
  defaultType?: BackendEventType;
};

export const CreateEventModal = ({
  onClose,
  onCreated,
  defaultType,
}: Props) => {
  const {
    isPlan,
    onTypeChange,
    category,
    titleInput,
    locationInput,
    descriptionInput,
    dateInput,
    timeInput,
    participants,
    timeframeInput,
    chatLinkInput,
    visibility,
    cover,
    canShare,
    submit,
  } = useCreateEvent(onCreated, defaultType);

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
        aria-labelledby="createEventTitle"
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
              <button
                type="button"
                className={clsx(s.typePill, isPlan && s.typePillActive)}
                onClick={() => onTypeChange('plan')}
                aria-pressed={isPlan}
              >
                Plan
              </button>
              <button
                type="button"
                className={clsx(s.typePill, !isPlan && s.typePillActive)}
                onClick={() => onTypeChange('wish')}
                aria-pressed={!isPlan}
              >
                Wish
              </button>
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
          <h2 id="createEventTitle" className={s.title}>
            {isPlan ? 'Create a plan' : 'Create a wish'}
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
                isPlan ? 'e.g., Friday pizza party' : 'e.g., Picnic in the park'
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
              placeholder={
                isPlan
                  ? 'Name of the spot or address'
                  : 'Any specific place or area?'
              }
              required
              value={locationInput.value}
              onChange={e => locationInput.onChange(e.target.value)}
              error={locationInput.error}
            />

            <TextArea
              id="eventDescription"
              label="Description"
              placeholder={
                isPlan
                  ? 'Share some details: the vibe, what to bring, etc.'
                  : 'Share some details about your idea'
              }
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
                        min={dateInput.min}
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
                        min={timeInput.min}
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
                    <HelperText
                      text={participants.maxError}
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
                </div>
              </>
            )}

            <PrivacyPicker
              value={visibility.value}
              onChange={visibility.onChange}
            />

            {isPlan && (
              <TextInput
                id="eventChatLink"
                label="Chat link"
                placeholder="Link to telegram or whatsapp group chat"
                value={chatLinkInput.value}
                onChange={e => chatLinkInput.onChange(e.target.value)}
                error={chatLinkInput.error}
              />
            )}

            {submit.error && (
              <HelperText text={submit.error} type="error" inline />
            )}
          </div>

          <button
            type="button"
            className={s.share}
            onClick={submit.onSubmit}
            disabled={!canShare || submit.isSubmitting}
          >
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};
