import { type MouseEventHandler } from 'react';
import clsx from 'clsx';
import {
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
import { AvatarImage } from '@shared/ui/avatarImage/AvatarImage';
import { EventImage } from '@shared/ui/eventImage/EventImage';
import { ProfileLink } from '@shared/ui/profileLink';
import type { FeedEvent } from '@client_pages/home/model/types';
import { EventCardMenu } from './EventCardMenu';
import type { EventParticipation } from '../model/useEventParticipation';
import s from './eventCard.module.scss';

type Props = {
  event: FeedEvent;
  isOwn: boolean;
  isArchived: boolean;
  showEventType: boolean;
  canOpenDetails: boolean;
  showChat: boolean;
  tourId?: string;
  participation: EventParticipation;
  onSurfaceClick: MouseEventHandler<HTMLElement>;
  onOpenDetails: () => void;
  onOpenRecap: () => void;
  onAction: () => void;
  onEdit?: (id: string) => void;
  onPlanIt?: (id: string) => void;
  onCancel?: (id: string) => void;
};

const MAX_VISIBLE_AVATARS = 3;

export const EventCardContent = ({
  event,
  isOwn,
  isArchived,
  showEventType,
  canOpenDetails,
  showChat,
  tourId,
  participation,
  onSurfaceClick,
  onOpenDetails,
  onOpenRecap,
  onAction,
  onEdit,
  onPlanIt,
  onCancel,
}: Props) => {
  const { id, type, hashtag, image, title, host, date, location, description } =
    event;
  const {
    count,
    participants,
    isParticipating,
    isPending,
    actionLabel,
    selectedLabel,
  } = participation;
  const shownParticipants = participants.slice(0, MAX_VISIBLE_AVATARS);
  const extraCount =
    shownParticipants.length < MAX_VISIBLE_AVATARS
      ? 0
      : Math.max(0, count - MAX_VISIBLE_AVATARS);
  const chatButton = event.chatLink ? (
    <a
      className={s.chat}
      href={event.chatLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open chat"
    >
      <MessagesSquare />
    </a>
  ) : null;

  return (
    <div
      className={clsx(s.surface, canOpenDetails && s.clickable)}
      onClick={onSurfaceClick}
    >
      <div className={s.media} data-tour={tourId}>
        <EventImage
          key={image}
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
          {hashtag && <span className={clsx(s.tag, s.hashtag)}>{hashtag}</span>}
        </div>
      </div>

      <div className={s.body} data-tour={tourId}>
        <div className={s.details}>
          <div className={s.titleRow}>
            <h2 className={s.title}>
              {canOpenDetails ? (
                <button
                  type="button"
                  className={s.titleButton}
                  onClick={onOpenDetails}
                >
                  {title}
                </button>
              ) : (
                title
              )}
            </h2>
            {!isArchived && (
              <EventCardMenu
                event={event}
                isOwn={isOwn}
                onCancelled={() => onCancel?.(id)}
              />
            )}
          </div>

          <ul className={s.meta}>
            <li className={s.metaRow}>
              <UserRound />
              <span className={s.avatar}>
                <AvatarImage
                  src={host.avatar}
                  alt={host.username}
                  loading="lazy"
                  fallbackWidth={14}
                  fallbackHeight={14}
                />
              </span>
              <ProfileLink username={host.username} className={s.username}>
                {host.username}
              </ProfileLink>
              {host.mutualFriend && (
                <span className={s.muted}>
                  · friend of{' '}
                  <ProfileLink username={host.mutualFriend} className={s.muted}>
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

        <div className={s.participants}>
          <UsersRound />
          {count > 0 ? (
            <>
              <div className={s.avatars}>
                {shownParticipants.map(participant => (
                  <span key={participant.username} className={s.stackAvatar}>
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
              {extraCount > 0 && <span className={s.extra}>+{extraCount}</span>}
            </>
          ) : (
            <span className={s.muted}>Be the first to join</span>
          )}
        </div>

        {isArchived ? (
          <button type="button" className={s.viewRecap} onClick={onOpenRecap}>
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
          </div>
        )}
      </div>
    </div>
  );
};
