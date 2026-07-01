'use client';

import { useState } from 'react';
import clsx from 'clsx';
import {
  Avatar,
  CalendarClock,
  Location,
  MessagesSquare,
  Pencil,
  Plus,
  StickyNote,
  UserRound,
  UsersRound,
  X,
} from '@shared/ui/icons';
import { ProfileLink } from '@shared/ui/profileLink';
import { toFeedEvents } from '@client_pages/home/model/feedMapper';
import type { FeedEvent } from '@client_pages/home/model/types';
import {
  expressInterest,
  joinPlan,
  leaveEvent,
} from '@/shared/client_api/event';
import { EventCardMenu } from './EventCardMenu';
import { EventDetailsModal } from './EventDetailsModal';
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
};

const MAX_VISIBLE_AVATARS = 3;

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
}: Props) => {
  const {
    id,
    type,
    hashtag,
    image,
    title,
    host,
    date,
    location,
    description,
    chatLink,
    participants: initialParticipants,
    participantCount: initialCount,
    userParticipationStatus: initialStatus,
  } = event;

  const [status, setStatus] = useState(initialStatus);
  const [count, setCount] = useState(initialCount);
  const [participants, setParticipants] = useState(initialParticipants);
  const [isPending, setIsPending] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isRecapOpen, setIsRecapOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(autoOpenDetails);

  const canOpenDetails = enableDetails && !isArchived;
  const isParticipating = status !== null;
  const shownParticipants = participants.slice(0, MAX_VISIBLE_AVATARS);
  const extraCount =
    shownParticipants.length < MAX_VISIBLE_AVATARS
      ? 0
      : Math.max(0, count - MAX_VISIBLE_AVATARS);
  const actionLabel = type === 'plan' ? 'Join' : 'Interested';
  const selectedLabel = type === 'plan' ? 'Joined' : 'Interested';

  const chatButton = chatLink ? (
    <a
      className={s.chat}
      href={chatLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open chat"
    >
      <MessagesSquare />
    </a>
  ) : null;

  const applyResponse = (resp: ReturnType<typeof toFeedEvents>[number]) => {
    setStatus(resp.userParticipationStatus);
    setCount(resp.participantCount);
    setParticipants(resp.participants);
  };

  const handleActionClick = async () => {
    if (isParticipating) {
      setIsLeaveDialogOpen(true);

      return;
    }

    setIsPending(true);

    try {
      const resp =
        type === 'plan' ? await joinPlan(id) : await expressInterest(id);

      applyResponse(toFeedEvents([resp])[0]);
    } catch {
      // silent revert
    } finally {
      setIsPending(false);
    }
  };

  const handleLeaveConfirm = async () => {
    setIsPending(true);

    try {
      const resp = await leaveEvent(id);

      applyResponse(toFeedEvents([resp])[0]);
      setIsLeaveDialogOpen(false);
    } catch {
      // silent revert
    } finally {
      setIsPending(false);
    }
  };

  const handleLeaveDialogClose = () => {
    if (!isPending) {
      setIsLeaveDialogOpen(false);
    }
  };

  const openDetails = () => {
    setIsDetailsOpen(true);
    onDetailsOpen?.();
  };

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!canOpenDetails) return;
    if (isDetailsOpen || isRecapOpen || isLeaveDialogOpen) return;
    if ((e.target as HTMLElement).closest('button, a')) return;

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
          count={count}
          participants={participants}
          isParticipating={isParticipating}
          isPending={isPending}
          actionLabel={actionLabel}
          selectedLabel={selectedLabel}
          onAction={handleActionClick}
          onClose={() => {
            setIsDetailsOpen(false);
            onDetailsClose?.();
          }}
        />
      )}

      {isLeaveDialogOpen && (
        <div className={s.leaveOverlay}>
          <div className={s.leaveDialog} role="dialog">
            <h2 className={s.leaveDialogTitle}>Leave this event?</h2>
            <div className={s.leaveDialogActions}>
              <button
                type="button"
                className={s.noThanksButton}
                onClick={handleLeaveDialogClose}
                disabled={isPending}
              >
                <span>No, thanks</span>
              </button>
              <button
                type="button"
                className={s.leaveButton}
                onClick={handleLeaveConfirm}
                disabled={isPending}
              >
                <span>Leave</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (detailsOnly) {
    return modals;
  }

  return (
    <article className={s.card}>
      <div
        className={clsx(s.surface, canOpenDetails && s.clickable)}
        onClick={handleCardClick}
      >
        <div className={s.media}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={clsx(s.image, isArchived && s.imageArchived)}
            src={image}
            alt={title}
            loading="lazy"
          />
          <div className={s.tags}>
            {showEventType && (
              <span className={clsx(s.tag, type === 'plan' ? s.plan : s.wish)}>
                {type}
              </span>
            )}
            {hashtag && (
              <span className={clsx(s.tag, s.hashtag)}>{hashtag}</span>
            )}
          </div>
        </div>

        <div className={s.body}>
          <div className={s.details}>
            <div className={s.titleRow}>
              <h2 className={s.title}>
                {enableDetails && !isArchived ? (
                  <button
                    type="button"
                    className={s.titleButton}
                    onClick={openDetails}
                  >
                    {title}
                  </button>
                ) : (
                  title
                )}
              </h2>
              {!isArchived && (
                <EventCardMenu
                  eventId={id}
                  eventType={type}
                  isOwn={isOwn}
                  onCancelled={() => onCancel?.(id)}
                />
              )}
            </div>

            <ul className={s.meta}>
              <li className={s.metaRow}>
                <UserRound />
                <span className={s.avatar}>
                  {host.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={host.avatar} alt={host.username} loading="lazy" />
                  ) : (
                    <Avatar width={14} height={14} />
                  )}
                </span>
                <ProfileLink username={host.username} className={s.username}>
                  {host.username}
                </ProfileLink>
                {host.mutualFriend && (
                  <span className={s.muted}>
                    · friend of{' '}
                    <ProfileLink
                      username={host.mutualFriend}
                      className={s.muted}
                    >
                      {host.mutualFriend}
                    </ProfileLink>
                  </span>
                )}
              </li>
              <li className={s.metaRow}>
                <CalendarClock />
                <span>{date}</span>
              </li>
              <li className={s.metaRow}>
                <Location />
                <span>{location}</span>
              </li>
              <li className={clsx(s.metaRow, s.metaRowTop)}>
                <StickyNote />
                {description ? (
                  <span className={s.description}>{description}</span>
                ) : (
                  <span className={s.muted}>No details added by the host.</span>
                )}
              </li>
            </ul>
          </div>

          {count > 0 ? (
            <div className={s.participants}>
              <UsersRound />
              <div className={s.avatars}>
                {shownParticipants.map((participant, index) => (
                  <span key={index} className={s.stackAvatar}>
                    {participant.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={participant.avatar}
                        alt={participant.username}
                        loading="lazy"
                      />
                    ) : (
                      <Avatar width={28} height={28} />
                    )}
                  </span>
                ))}
              </div>
              {extraCount > 0 && <span className={s.extra}>+{extraCount}</span>}
            </div>
          ) : (
            <div className={s.participants}>
              <UsersRound />
              <span className={s.muted}>Be the first to join</span>
            </div>
          )}

          {isArchived ? (
            <button
              type="button"
              className={s.viewRecap}
              onClick={() => setIsRecapOpen(true)}
            >
              <span>View recap</span>
            </button>
          ) : isOwn ? (
            <div className={s.actions}>
              {showChat && chatButton}
              <div className={s.ownerActions}>
                <button
                  type="button"
                  className={s.edit}
                  onClick={() => onEdit?.(id)}
                >
                  <Pencil />
                  <span>Edit</span>
                </button>
                {type === 'wish' && (
                  <button
                    type="button"
                    className={s.planIt}
                    onClick={() => onPlanIt?.(id)}
                  >
                    <span>Plan it</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className={s.actions}>
              {showChat && chatButton}
              <button
                type="button"
                className={clsx(s.action, isParticipating && s.joined)}
                onClick={handleActionClick}
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
            </div>
          )}
        </div>
      </div>

      {modals}
    </article>
  );
};
