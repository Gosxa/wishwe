import clsx from 'clsx';
import { Asterisk, CalendarClock, Clock } from '@shared/ui/icons';
import { HelperText } from '@shared/ui/helperText/HelperText';
import { Stepper } from '@shared/ui/stepper/Stepper';
import { TextInput } from '@shared/ui/textInput/TextInput';
import { Toggle } from '@shared/ui/toggle/Toggle';
import type { EventFormMode, EventFormModel } from '../model/types';
import s from './eventFormModal.module.scss';

type Props = {
  mode: EventFormMode;
  form: EventFormModel;
};

export const EventTimingFields = ({ mode, form }: Props) => {
  const { isPlan, dateInput, timeInput, participants, timeframeInput } = form;

  if (!isPlan) {
    return (
      <>
        <TextInput
          id="eventTimeframe"
          label="Timeframe"
          placeholder="Next weekend or sometime in June"
          required
          value={timeframeInput.value}
          onChange={event => timeframeInput.onChange(event.target.value)}
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
          {mode === 'edit' && participants.minError && (
            <HelperText text={participants.minError} type="error" inline />
          )}
        </div>
      </>
    );
  }

  const participantError =
    mode === 'edit'
      ? (participants.minError ?? participants.maxError)
      : participants.maxError;

  return (
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
              className={clsx(s.dateTimeInput, dateInput.error && s.inputError)}
              value={dateInput.value}
              min={dateInput.min}
              onChange={event => dateInput.onChange(event.target.value)}
              aria-label="Event date"
            />
            <CalendarClock />
          </div>
          <div className={clsx(s.dateTimeWrapper, s.dateTimeWrapperTime)}>
            <input
              type="time"
              className={clsx(s.dateTimeInput, timeInput.error && s.inputError)}
              value={timeInput.value}
              min={timeInput.min}
              onChange={event => timeInput.onChange(event.target.value)}
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
                id={mode === 'create' ? 'planUnlimited' : 'editPlanUnlimited'}
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
};
