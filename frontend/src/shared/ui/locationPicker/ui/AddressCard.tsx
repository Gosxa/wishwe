'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';
import type { FormattedLocation } from '@/shared/lib/googleMaps/formatLocation';
import { formatCoordinates } from '@/shared/lib/googleMaps/formatLocation';
import type { ResolvedPlace } from '@/shared/lib/googleMaps/types';
import { Location, Refresh, WarningTriangle, WifiOff } from '../../icons';
import { LOCATION_PICKER_COPY as COPY } from '../copy';
import type { PickerStage, PickerStep } from '../model/useLocationPicker';
import s from '../locationPicker.module.scss';

type Props = {
  stage: PickerStage;
  step: PickerStep;
  place: ResolvedPlace | null;
  formatted: FormattedLocation | null;
  maxLength: number;
  onRetryGeocode: () => void;
};

const EmptyCard = ({
  title,
  body,
  icon,
}: {
  title: string;
  body?: string;
  icon?: ReactNode;
}) => (
  <div className={clsx(s.addressCard, s.addressCardMuted)}>
    <span
      className={clsx(s.addressIcon, s.addressIconPlaceholder)}
      aria-hidden="true"
    >
      {icon ?? <Location size={20} />}
    </span>
    <div className={s.addressText}>
      <p className={s.addressTitle}>{title}</p>
      {body && <p className={s.addressBody}>{body}</p>}
    </div>
  </div>
);

export const AddressCard = ({
  stage,
  step,
  place,
  formatted,
  maxLength,
  onRetryGeocode,
}: Props) => {
  if (stage === 'mapFailed') {
    return (
      <EmptyCard
        icon={<WifiOff size={20} />}
        title={COPY.errors.mapFailedCard.title}
        body={COPY.errors.mapFailedCard.body}
      />
    );
  }

  if (stage === 'idle' || stage === 'loading') {
    if (step !== 'map') {
      return <EmptyCard title={COPY.pendingCard} body={COPY.pendingCardHint} />;
    }

    return <EmptyCard title={COPY.emptyCard} body={COPY.emptyCardHint} />;
  }

  if (stage === 'tooBroad') {
    return (
      <div className={clsx(s.addressCard, s.addressCardWarn)}>
        <span className={s.addressIcon} aria-hidden="true">
          <WarningTriangle size={20} />
        </span>
        <div className={s.addressText}>
          <p className={s.addressTitle}>{COPY.errors.tooBroad.title}</p>
          <p className={s.addressBody}>{COPY.errors.tooBroad.body}</p>
        </div>
      </div>
    );
  }

  if (stage === 'resolving') {
    return (
      <div className={clsx(s.addressCard, s.addressCardMuted)}>
        <span className={s.addressIcon} aria-hidden="true">
          <Location size={20} />
        </span>
        <div className={s.addressText}>
          <p className={s.addressTitle}>{COPY.lookingUp}</p>
          <span className={s.skeletonLine} />
          <span className={clsx(s.skeletonLine, s.skeletonLineShort)} />
        </div>
      </div>
    );
  }

  if (!place) return null;

  const coordinates = formatCoordinates(place.lat, place.lng);

  if (stage === 'geocodeFailed') {
    return (
      <div className={clsx(s.addressCard, s.addressCardError)}>
        <span className={s.addressIcon} aria-hidden="true">
          <WarningTriangle size={20} />
        </span>
        <div className={s.addressText}>
          <p className={s.addressTitle}>{COPY.errors.geocodeFailed.title}</p>
          <p className={s.addressBody}>{COPY.errors.geocodeFailed.body}</p>
          <p className={s.addressMeta}>{coordinates}</p>
        </div>
        <button type="button" className={s.cardAction} onClick={onRetryGeocode}>
          <Refresh />
          <span>{COPY.actions.tryAgain}</span>
        </button>
      </div>
    );
  }

  if (stage === 'noAddress') {
    return (
      <div className={clsx(s.addressCard, s.addressCardWarn)}>
        <span className={s.addressIcon} aria-hidden="true">
          <WarningTriangle size={20} />
        </span>
        <div className={s.addressText}>
          <p className={s.addressTitle}>{COPY.errors.noAddress.title}</p>
          {place.nearestPlace && (
            <p className={s.addressBody}>
              {COPY.errors.noAddress.nearest(place.nearestPlace)}
            </p>
          )}
          <p className={s.addressMeta}>
            {COPY.errors.noAddress.body(coordinates)}
          </p>
        </div>
      </div>
    );
  }

  const wasTrimmed = Boolean(formatted?.wasTrimmed);
  const title = place.name ?? place.formattedAddress ?? coordinates;
  const body = place.formattedAddress === title ? null : place.formattedAddress;

  return (
    <div
      className={clsx(s.addressCard, wasTrimmed && s.addressCardWarn)}
      aria-live="polite"
    >
      <span className={s.addressIcon} aria-hidden="true">
        {wasTrimmed ? <WarningTriangle size={20} /> : <Location size={20} />}
      </span>
      <div className={s.addressText}>
        <p className={s.addressTitle}>{title}</p>
        {body && <p className={s.addressBody}>{body}</p>}
        <p className={s.addressMeta}>{coordinates}</p>
        {wasTrimmed && formatted && (
          <p className={s.addressBanner}>
            <strong>{COPY.errors.trimmed.title}</strong>{' '}
            {COPY.errors.trimmed.body(maxLength)}
            <span className={s.addressTrimmed}>{formatted.value}</span>
          </p>
        )}
      </div>
    </div>
  );
};
