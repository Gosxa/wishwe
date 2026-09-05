'use client';

import type { BackendEvent } from '@/shared/client_api/event';
import {
  EventFormModalLayout,
  EventTypePreview,
  PlanConversionFields,
} from '@/features/eventForm';
import { useModalTransition } from '@shared/hooks/useModalTransition';
import { EVENT_IMAGE_FALLBACK } from '@shared/lib/mediaFallbacks';
import { toAbsoluteMediaUrl } from '@client_pages/home/model/feedMapper';
import { usePlanIt } from '../model/usePlanIt';
import { usePlanConversionTransition } from '../model/usePlanConversionTransition';
import { PlanConversionTransition } from './PlanConversionTransition';

type Props = {
  event: BackendEvent;
  onClose: () => void;
  onConverted: () => void;
};

export const PlanItModal = ({ event, onClose, onConverted }: Props) => {
  const { requestClose, modalTransitionProps } = useModalTransition(onClose);
  const conversion = usePlanConversionTransition(onConverted);
  const { when, participants, submit } = usePlanIt(event, conversion.succeed, {
    showGlobalLoader: false,
    onSubmitStart: conversion.start,
    onSubmitError: conversion.fail,
  });
  const isConverting = conversion.state !== 'idle';

  const coverPreviewUrl =
    toAbsoluteMediaUrl(event.cover_image) ?? EVENT_IMAGE_FALLBACK;

  return (
    <>
      <div
        inert={isConverting}
        aria-hidden={isConverting || undefined}
        hidden={conversion.state === 'closing'}
      >
        <EventFormModalLayout
          titleId="planItTitle"
          title="Create a plan"
          sidebar={<EventTypePreview type="plan" coverUrl={coverPreviewUrl} />}
          submitLabel="Share"
          submitDisabled={submit.isSubmitting || isConverting}
          compact
          onSubmit={submit.onSubmit}
          onClose={() => {
            if (!isConverting && !submit.isSubmitting) requestClose();
          }}
          overlayProps={modalTransitionProps}
        >
          <PlanConversionFields
            eventTitle={event.title}
            date={{
              value: when.date,
              min: when.minDate,
              error: when.dateError,
              onChange: when.onDateChange,
            }}
            time={{
              value: when.time,
              min: when.minTime,
              error: when.timeError,
              onChange: when.onTimeChange,
            }}
            participants={participants}
            participantError={participants.maxError}
            unlimitedToggleId="planUnlimited"
            submitError={submit.error}
          />
        </EventFormModalLayout>
      </div>
      {conversion.state !== 'idle' && (
        <PlanConversionTransition
          state={conversion.state}
          title={event.title}
          date={when.date}
          time={when.time}
        />
      )}
    </>
  );
};
