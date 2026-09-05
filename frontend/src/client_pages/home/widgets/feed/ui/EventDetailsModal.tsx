'use client';

import { useRef, useState } from 'react';
import clsx from 'clsx';
import { Copy, MessagesSquare, Plus, X } from '@shared/ui/icons';
import { AvatarImage } from '@shared/ui/avatarImage/AvatarImage';
import { EventImage } from '@shared/ui/eventImage/EventImage';
import { MapLinkedAddress } from '@shared/ui/mapLinkedAddress/MapLinkedAddress';
import { useBodyScrollLock } from '@/features';
import { useModalAttention } from '@shared/hooks/useModalAttention';
import { useModalTransition } from '@shared/hooks/useModalTransition';
import type { FeedEvent } from '@client_pages/home/model/types';
import type { EventParticipation } from '../model/useEventParticipation';
import { ParticipantsModal } from './ParticipantsModal';
import s from './eventDetailsModal.module.scss';

type Props = {
  event: FeedEvent;
  participation: EventParticipation;
  isInactive?: boolean;
  onAction: () => void;
  onClose: () => void;
};

const MAX_VISIBLE_AVATARS = 6;
const COPIED_RESET_MS = 2000;
const UNLIMITED_MAX = 3000;

export const EventDetailsModal = ({
  event,
  participation,
  isInactive = false,
  onAction,
  onClose,
}: Props) => {
  const { requestClose, modalTransitionProps } = useModalTransition(onClose);
  const {
    image,
    title,
    date,
    location,
    locationPlaceId,
    description,
    chatLink,
    maxParticipants,
  } = event;
  const {
    count,
    participants,
    isParticipating,
    isPending,
    actionLabel,
    selectedLabel,
  } = participation;

  const [copied, setCopied] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const participantsTriggerRef = useRef<HTMLButtonElement>(null);
  const isObscured = isInactive || isParticipantsOpen;

  useBodyScrollLock();
  const pulseModal = useModalAttention();

  const handleCopy = async () => {
    if (!chatLink) return;

    try {
      await navigator.clipboard.writeText(chatLink);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {}
  };

  const shownParticipants = participants.slice(0, MAX_VISIBLE_AVATARS);
  const isUnlimited =
    maxParticipants != null && maxParticipants >= UNLIMITED_MAX;
  const counterLabel =
    maxParticipants != null && !isUnlimited
      ? `${count}/${maxParticipants}`
      : String(count);

  return (
    <div
      {...modalTransitionProps}
      className={s.overlay}
      onClick={isObscured ? undefined : pulseModal}
    >
      <div
        data-modal-content
        className={s.modal}
        role="dialog"
        aria-modal={isObscured ? undefined : 'true'}
        aria-hidden={isObscured ? 'true' : undefined}
        aria-labelledby="eventDetailsTitle"
        inert={isObscured ? true : undefined}
      >
        <button
          type="button"
          className={s.close}
          onClick={requestClose}
          aria-label="Close"
        >
          <X />
        </button>

        <div className={s.cover}>
          <EventImage src={image} alt={title} />
        </div>

        <div className={s.body}>
          <h2 id="eventDetailsTitle" className={s.title}>
            {title}
          </h2>

          <div className={s.divider} />

          <div className={s.content}>
            <div className={s.fields}>
              <div className={s.field}>
                <span className={s.fieldLabel}>Timeframe</span>
                <span className={s.fieldValue}>{date}</span>
              </div>

              <div className={s.field}>
                <span className={s.fieldLabel}>Where</span>
                <div className={s.fieldValue}>
                  <MapLinkedAddress
                    address={location}
                    placeId={locationPlaceId}
                  />
                </div>
              </div>

              <div className={s.field}>
                <span className={s.fieldLabel}>Description</span>
                {description ? (
                  <span className={s.fieldValue}>{description}</span>
                ) : (
                  <span className={s.emptyValue}>
                    No details added by the host
                  </span>
                )}
              </div>

              <div className={s.field}>
                <span className={s.fieldLabel}>Chat link</span>
                <div className={s.chatBox}>
                  {!isParticipating ? (
                    <span className={s.chatHint}>
                      Link available after joining
                    </span>
                  ) : chatLink ? (
                    <>
                      <span className={clsx(s.chatLink, copied && s.copied)}>
                        {copied ? 'Link Copied' : chatLink}
                      </span>
                      <button
                        type="button"
                        className={clsx(s.copyBtn, copied && s.copied)}
                        onClick={handleCopy}
                        aria-label={copied ? 'Copied' : 'Copy chat link'}
                      >
                        <Copy />
                      </button>
                    </>
                  ) : (
                    <span className={s.chatPlaceholder}>
                      No link provided :(
                    </span>
                  )}
                </div>
              </div>

              <div className={s.field}>
                <span className={s.fieldLabel}>Who is going:</span>
                {count > 0 ? (
                  <div className={s.attendees}>
                    <div className={s.avatars}>
                      {shownParticipants.map(participant => (
                        <span
                          key={participant.username}
                          className={s.stackAvatar}
                        >
                          <AvatarImage
                            src={participant.avatar}
                            alt={participant.username}
                            loading="lazy"
                            fallbackWidth={28}
                            fallbackHeight={28}
                          />
                        </span>
                      ))}
                    </div>
                    <button
                      ref={participantsTriggerRef}
                      type="button"
                      className={s.counter}
                      onClick={() => setIsParticipantsOpen(true)}
                    >
                      {counterLabel}
                    </button>
                  </div>
                ) : (
                  <span className={s.muted}>Be the first to join</span>
                )}
              </div>
            </div>

            <div className={s.actions}>
              <button
                type="button"
                className={clsx(s.action, isParticipating && s.joined)}
                onClick={onAction}
                disabled={isPending}
              >
                {isParticipating ? (
                  <>
                    <span className={s.selectedFace}>{selectedLabel}</span>
                    <span className={s.leaveFace}>
                      <X />
                      Leave
                    </span>
                  </>
                ) : (
                  <>
                    <Plus />
                    <span>{actionLabel}</span>
                  </>
                )}
              </button>

              {isParticipating && chatLink && (
                <a
                  className={s.openChat}
                  href={chatLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessagesSquare />
                  <span>Open chat</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {isParticipantsOpen && (
        <ParticipantsModal
          eventId={event.id}
          initialParticipants={participants}
          returnFocusRef={participantsTriggerRef}
          onClose={() => setIsParticipantsOpen(false)}
        />
      )}
    </div>
  );
};
