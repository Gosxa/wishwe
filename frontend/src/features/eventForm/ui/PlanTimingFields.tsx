import clsx from 'clsx';
import { Asterisk, CalendarClock, Clock } from '@shared/ui/icons';
import { HelperText } from '@shared/ui/helperText/HelperText';
import { Stepper } from '@shared/ui/stepper/Stepper';
import { Toggle } from '@shared/ui/toggle/Toggle';
import s from './eventFormModal.module.scss';

type DateTimeField = {
  value: string;
  min?: string;
  error?: string;
  onChange: (value: string) => void;
};

type ParticipantsField = {
  min: number;
  max: number;
  unlimited: boolean;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  onUnlimitedChange: (value: boolean) => void;
};

export type PlanTimingFieldsProps = {
  date: DateTimeField;
  time: DateTimeField;
  participants: ParticipantsField;
  participantError?: string;
  unlimitedToggleId: string;
};

export const PlanTimingFields = ({
  date,
  time,
  participants,
  participantError,
  unlimitedToggleId,
}: PlanTimingFieldsProps) => (
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
            className={clsx(s.dateTimeInput, date.error && s.inputError)}
            value={date.value}
            min={date.min}
            onChange={event => date.onChange(event.target.value)}
            aria-label="Event date"
          />
          <CalendarClock />
        </div>
        <div className={clsx(s.dateTimeWrapper, s.dateTimeWrapperTime)}>
          <input
            type="time"
            className={clsx(s.dateTimeInput, time.error && s.inputError)}
            value={time.value}
            min={time.min}
            onChange={event => time.onChange(event.target.value)}
            aria-label="Event time"
          />
          <Clock />
        </div>
      </div>
      {(date.error ?? time.error) && (
        <HelperText
          text={(date.error ?? time.error) as string}
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
              id={unlimitedToggleId}
              checked={participants.unlimited}
              onChange={participants.onUnlimitedChange}
            />
          </div>
        </div>
      </div>
      {participantError && (
        <HelperText text={participantError} type="error" inline />
      )}
    </div>
  </>
);
