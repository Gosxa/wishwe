'use client';

import clsx from 'clsx';
import type { RefObject } from 'react';
import type { GeolocationFailure } from '@/shared/lib/geolocation/types';
import { Crosshair, Location, Lock, SearchIcon } from '../../icons';
import { LOCATION_PICKER_COPY as COPY } from '../copy';
import s from '../locationPicker.module.scss';

const TITLE_ID = 'locationPickerIntroTitle';
const BODY_ID = 'locationPickerIntroBody';

type Props = {
  step: 'permission' | 'locating' | 'manual';
  failure: GeolocationFailure | null;
  allowRef: RefObject<HTMLButtonElement | null>;
  onAllow: () => void;
  onSkip: () => void;
};

export const PickerIntro = ({
  step,
  failure,
  allowRef,
  onAllow,
  onSkip,
}: Props) => {
  const isManual = step === 'manual';
  const copy = COPY[step];
  const note = isManual && failure ? COPY.manual.notes[failure] : null;

  return (
    <section
      className={clsx(s.intro, isManual && s.introManual)}
      aria-labelledby={TITLE_ID}
      data-testid="location-picker-intro"
      data-step={step}
    >
      <span
        className={clsx(s.introBadge, step !== 'manual' && s.introBadgeLive)}
        aria-hidden="true"
        data-testid={
          step === 'locating' ? 'location-picker-pin-pulse' : undefined
        }
      >
        {isManual ? <SearchIcon /> : <Location size={26} />}
      </span>

      <h3 id={TITLE_ID} className={s.introTitle}>
        {copy.title}
      </h3>
      <p id={BODY_ID} className={s.introBody}>
        {copy.body}
      </p>

      {step === 'permission' && (
        <>
          <div className={s.introActions}>
            <button
              ref={allowRef}
              type="button"
              className={s.primaryButton}
              onClick={onAllow}
              aria-describedby={BODY_ID}
            >
              <Crosshair size={16} />
              <span>{COPY.permission.allow}</span>
            </button>
            <button
              type="button"
              className={s.secondaryButton}
              onClick={onSkip}
            >
              <span>{COPY.permission.skip}</span>
            </button>
          </div>
          <p className={s.introPrivacy}>
            <Lock width={12} height={12} />
            {COPY.permission.privacy}
          </p>
        </>
      )}

      {step === 'locating' && (
        <div className={s.introActions}>
          <button type="button" className={s.linkButton} onClick={onSkip}>
            <span>{COPY.locating.skip}</span>
          </button>
        </div>
      )}

      {note && <p className={s.introNote}>{note}</p>}
    </section>
  );
};
