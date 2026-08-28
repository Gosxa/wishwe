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

type Props = {
  event: BackendEvent;
  onClose: () => void;
  onConverted: () => void;
};

export const PlanItModal = ({ event, onClose, onConverted }: Props) => {
  const { requestClose, requestCloseWith, modalTransitionProps } =
    useModalTransition(onClose);
  const { when, participants, submit } = usePlanIt(event, () =>
    requestCloseWith(onConverted),
  );

  const coverPreviewUrl =
    toAbsoluteMediaUrl(event.cover_image) ?? EVENT_IMAGE_FALLBACK;

  return (
    <EventFormModalLayout
      titleId="planItTitle"
      title="Create a plan"
      sidebar={<EventTypePreview type="plan" coverUrl={coverPreviewUrl} />}
      submitLabel="Share"
      submitDisabled={submit.isSubmitting}
      compact
      onSubmit={submit.onSubmit}
      onClose={requestClose}
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
  );
};
