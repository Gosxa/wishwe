'use client';

import { type MouseEvent, useEffect, useRef, useState } from 'react';
import { useBodyScrollLock } from '@/features';
import { useModalAttention } from '@shared/hooks/useModalAttention';
import { useModalTransition } from '@shared/hooks/useModalTransition';
import type { FeedEvent } from '@client_pages/home/model/types';
import { useEventParticipation } from '../model/useEventParticipation';
import { EventCardContent } from './EventCardContent';
import { EventDetailsModal } from './EventDetailsModal';
import { LeaveEventDialog } from './LeaveEventDialog';
import { RecapModal } from './RecapModal';
import s from './eventCard.module.scss';

type Props = {
  event: FeedEvent;
  isOwn?: boolean;
  isArchived?: boolean;
  showEventType?: boolean;
  enableDetails?: boolean;
  autoOpenDetails?: boolean;
  detailsOnly?: boolean;
  showChat?: boolean;
  onEdit?: (id: string) => void;
  onPlanIt?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDetailsOpen?: () => void;
  onDetailsClose?: () => void;
  tourId?: string;
};

export const EventCard = ({
  event,
  isOwn = false,
  isArchived = false,
  showEventType = true,
  enableDetails = false,
  autoOpenDetails = false,
  detailsOnly = false,
  showChat = false,
  onEdit,
  onPlanIt,
  onCancel,
  onDetailsOpen,
  onDetailsClose,
  tourId,
}: Props) => {
  const participation = useEventParticipation(event);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isRecapOpen, setIsRecapOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(autoOpenDetails);
  const [participationError, setParticipationError] = useState<string | null>(
    null,
  );
  const leaveReturnFocusRef = useRef<HTMLElement | null>(null);
  const leaveCancelRef = useRef<HTMLButtonElement>(null);
  const pulseModal = useModalAttention();
  const {
    requestClose: requestLeaveDialogClose,
    modalTransitionProps: leaveDialogTransitionProps,
  } = useModalTransition(() => setIsLeaveDialogOpen(false));

  useBodyScrollLock(isLeaveDialogOpen);

  useEffect(() => {
    if (!isLeaveDialogOpen) return;

    leaveCancelRef.current?.focus();

    return () => {
      leaveReturnFocusRef.current?.focus();
      leaveReturnFocusRef.current = null;
    };
  }, [isLeaveDialogOpen]);

  const canOpenDetails = enableDetails && !isArchived;

  const handleActionClick = async () => {
    setParticipationError(null);

    if (!participation.isParticipating) {
      if (!(await participation.join())) {
        setParticipationError('Could not join this event. Please try again.');
      }

      return;
    }

    leaveReturnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setIsLeaveDialogOpen(true);
  };

  const handleLeaveConfirm = async () => {
    setParticipationError(null);

    if (await participation.leave()) {
      requestLeaveDialogClose();

      return;
    }

    setParticipationError('Could not leave this event. Please try again.');
  };

  const handleLeaveDialogClose = () => {
    if (!participation.isPending) requestLeaveDialogClose();
  };

  const openDetails = () => {
    setIsDetailsOpen(true);
    onDetailsOpen?.();
  };

  const handleCardClick = (mouseEvent: MouseEvent<HTMLElement>) => {
    if (!canOpenDetails) return;
    if (isDetailsOpen || isRecapOpen || isLeaveDialogOpen) return;
    if ((mouseEvent.target as HTMLElement).closest('button, a')) return;

    openDetails();
  };

  const modals = (
    <>
      {isRecapOpen && (
        <RecapModal event={event} onClose={() => setIsRecapOpen(false)} />
      )}

      {isDetailsOpen && (
        <EventDetailsModal
          event={event}
          participation={participation}
          isInactive={isLeaveDialogOpen}
          onAction={handleActionClick}
          onClose={() => {
            setIsDetailsOpen(false);
            onDetailsClose?.();
          }}
        />
      )}

      {isLeaveDialogOpen && (
        <LeaveEventDialog
          isNested={isDetailsOpen}
          isPending={participation.isPending}
          cancelRef={leaveCancelRef}
          transitionProps={leaveDialogTransitionProps}
          onBackdropClick={pulseModal}
          onClose={handleLeaveDialogClose}
          onConfirm={handleLeaveConfirm}
        />
      )}

      {participationError && (
        <div className={s.participationToast} role="alert">
          {participationError}
        </div>
      )}
    </>
  );

  if (detailsOnly) return modals;

  return (
    <article className={s.card}>
      <EventCardContent
        event={event}
        isOwn={isOwn}
        isArchived={isArchived}
        showEventType={showEventType}
        canOpenDetails={canOpenDetails}
        showChat={showChat}
        tourId={tourId}
        participation={participation}
        onSurfaceClick={handleCardClick}
        onOpenDetails={openDetails}
        onOpenRecap={() => setIsRecapOpen(true)}
        onAction={handleActionClick}
        onEdit={onEdit}
        onPlanIt={onPlanIt}
        onCancel={onCancel}
      />

      {modals}
    </article>
  );
};
