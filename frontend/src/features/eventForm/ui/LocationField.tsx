'use client';

import { useRef, useState } from 'react';
import { isMapsConfigured } from '@/shared/lib/googleMaps/loadGoogleMaps';
import { Location, WarningTriangle } from '@shared/ui/icons';
import { LOCATION_FIELD_COPY as COPY } from '@shared/ui/locationPicker/copy';
import { LocationPickerModal } from '@shared/ui/locationPicker/LocationPickerModal';
import { TextInput } from '@shared/ui/textInput/TextInput';
import type { EventFormMode, EventFormModel } from '../model/types';
import s from './locationField.module.scss';

type Props = {
  mode: EventFormMode;
  placeholder: string;
  input: EventFormModel['locationInput'];
  picker: EventFormModel['locationPicker'];
};

export const LocationField = ({ mode, placeholder, input, picker }: Props) => {
  const [openedFrom, setOpenedFrom] = useState<'button' | 'change' | null>(
    null,
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isAvailable = isMapsConfigured();

  const open = (source: 'button' | 'change') => setOpenedFrom(source);
  const close = () => {
    setOpenedFrom(null);
    buttonRef.current?.focus();
  };

  const labelAction = isAvailable ? (
    <button
      ref={buttonRef}
      type="button"
      className={s.pickButton}
      onClick={() => open('button')}
    >
      <Location size={16} />
      <span>{COPY.pick}</span>
    </button>
  ) : null;

  const statusRow =
    picker.status === 'none' ? null : (
      <div className={s.statusRow}>
        {picker.status === 'pinned' ? (
          <>
            <span className={s.chip}>
              <Location size={14} />
              {COPY.pinned}
            </span>
            <button
              type="button"
              className={s.link}
              onClick={() => open('change')}
            >
              {COPY.change}
            </button>
            <button type="button" className={s.link} onClick={picker.clear}>
              {COPY.clear}
            </button>
          </>
        ) : (
          <>
            <span className={`${s.chip} ${s.chipWarn}`}>
              <WarningTriangle size={14} />
              {COPY.editedByHand}
            </span>
            <button
              type="button"
              className={s.link}
              onClick={() => open('button')}
            >
              {COPY.pickAgain}
            </button>
          </>
        )}
      </div>
    );

  return (
    <>
      <TextInput
        id="eventLocation"
        tourId="field-location"
        label="Where?"
        placeholder={placeholder}
        required
        value={input.value}
        onChange={event => input.onChange(event.target.value)}
        error={input.error}
        helperText={isAvailable ? undefined : COPY.unavailable}
        labelAction={labelAction}
        statusRow={statusRow}
      />

      <p className={s.announcer} role="status" aria-live="polite">
        {picker.announcement}
      </p>

      {openedFrom && (
        <LocationPickerModal
          mode={mode}
          source={openedFrom}
          initialValue={input.value}
          initialPin={picker.pin}
          onConfirm={pin => {
            picker.apply(pin);
            close();
          }}
          onClose={close}
        />
      )}
    </>
  );
};
