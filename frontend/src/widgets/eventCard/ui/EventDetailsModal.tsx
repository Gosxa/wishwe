'use client';

import { useRef, useState } from 'react';
import clsx from 'clsx';
import {
  CalendarClock,
  ChevronLeft,
  Copy,
  Location,
  MessagesSquare,
  Plus,
  StickyNote,
  UsersRound,
  X,
} from '@shared/ui/icons';
import { ProfileLink } from '@shared/ui/profileLink';
import { AvatarImage } from '@shared/ui/avatarImage/AvatarImage';
import { EventImage } from '@shared/ui/eventImage/EventImage';
import { MapLinkedAddress } from '@shared/ui/mapLinkedAddress/MapLinkedAddress';
import { useBodyScrollLock } from '@/features';
import { useModalAttention } from '@shared/hooks/useModalAttention';
import { useModalTransition } from '@shared/hooks/useModalTransition';
import type { FeedEvent } from '@entities/event';
import type { EventParticipation } from '../model/useEventParticipation';
import { ParticipantsModal } from './ParticipantsModal';
import { EventCardMenu } from './EventCardMenu';
import s from './eventDetailsModal.module.scss';
import tags from './eventTags.module.scss';

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
          <span className={s.desktopClose}>
            <X />
          </span>
          <span className={s.mobileBack}>
            <ChevronLeft />
          </span>
        </button>

        <div className={s.cover}>
          <EventImage src={image} alt={title} />
        </div>

        <div className={s.body}>
          <div className={s.titleRow}>
            <h2 id="eventDetailsTitle" className={s.title}>
              {title}
            </h2>
            <div className={s.mobileMenu}>
              <EventCardMenu event={event} />
            </div>
          </div>
          <div className={s.tags}>
            <span
              className={clsx(
                tags.tag,
                event.type === 'plan' ? tags.plan : tags.wish,
              )}
            >
              {event.type}
            </span>
            {event.hashtag && (
              <span className={clsx(tags.tag, tags.hashtag)}>
                {event.hashtag}
              </span>
            )}
          </div>

          <div className={s.divider} />

          <div className={s.content}>
            <div className={s.fields}>
              <div className={s.host}>
                <span className={s.hostAvatar}>
                  <AvatarImage
                    src={event.host.avatar}
                    alt=""
                    fallbackWidth={16}
                    fallbackHeight={16}
                  />
                </span>
                <ProfileLink username={event.host.username}>
                  {event.host.username}
                </ProfileLink>
                {event.host.mutualFriend && (
                  <span>
                    · friend of{' '}
                    <ProfileLink username={event.host.mutualFriend}>
                      {event.host.mutualFriend}
                    </ProfileLink>
                  </span>
                )}
              </div>
              <div className={clsx(s.field, s.timeField)}>
                <span className={s.mobileIcon}>
                  <CalendarClock />
                </span>
                <span className={s.fieldLabel}>Timeframe</span>
                <span className={s.fieldValue}>{date}</span>
              </div>

              <div className={clsx(s.field, s.locationField)}>
                <span className={s.mobileIcon}>
                  <Location />
                </span>
                <span className={s.fieldLabel}>Where</span>
                <div className={s.fieldValue}>
                  <MapLinkedAddress
                    address={location}
                    placeId={locationPlaceId}
                  />
                </div>
              </div>

              <div className={clsx(s.field, s.descriptionField)}>
                <span className={s.mobileIcon}>
                  <StickyNote />
                </span>
                <span className={s.fieldLabel}>Description</span>
                {description ? (
                  <span className={s.fieldValue}>{description}</span>
                ) : (
                  <span className={s.emptyValue}>
                    No details added by the host
                  </span>
                )}
              </div>

              <div className={clsx(s.field, s.chatField)}>
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

              <div className={clsx(s.field, s.participantsField)}>
                <span className={s.mobileIcon}>
                  <UsersRound />
                </span>
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
                      aria-label={`View all ${count} participants`}
                      onClick={() => setIsParticipantsOpen(true)}
                    >
                      <span className={s.desktopCount}>{counterLabel}</span>
                      <span className={s.mobileCount}>
                        {count > 3 ? `+${count - 3}` : count}
                      </span>
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
                  aria-label="Open chat"
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
