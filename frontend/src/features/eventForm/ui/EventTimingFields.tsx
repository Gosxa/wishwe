import { HelperText } from '@shared/ui/helperText/HelperText';
import { Stepper } from '@shared/ui/stepper/Stepper';
import { TextInput } from '@shared/ui/textInput/TextInput';
import type { EventFormMode, EventFormModel } from '../model/types';
import { PlanTimingFields } from './PlanTimingFields';
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
          tourId="field-timeframe"
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
    <PlanTimingFields
      date={dateInput}
      time={timeInput}
      participants={participants}
      participantError={participantError}
      unlimitedToggleId={
        mode === 'create' ? 'planUnlimited' : 'editPlanUnlimited'
      }
    />
  );
};
