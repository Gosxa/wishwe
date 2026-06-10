'use client';

import { useState } from 'react';
import clsx from 'clsx';
import {
  Avatar,
  CalendarClock,
  Location,
  Plus,
  StickyNote,
  UserRound,
  UsersRound,
  X,
} from '@shared/ui/icons';
import type { FeedEvent } from '@client_pages/home/model/types';
import s from './eventCard.module.scss';

type Props = {
  event: FeedEvent;
};

const MAX_VISIBLE_AVATARS = 3;

export const EventCard = ({ event }: Props) => {
  const {
    type,
    hashtag,
    image,
    title,
    host,
    date,
    location,
    description,
    participantCount,
    participants,
  } = event;

  const [joined, setJoined] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);

  const shownParticipants = participants.slice(0, MAX_VISIBLE_AVATARS);
  const extraCount = participantCount - shownParticipants.length;
  const actionLabel = type === 'plan' ? 'Join' : 'Interested';

  const handleActionClick = () => {
    if (joined) {
      setIsLeaveDialogOpen(true);

      return;
    }

    setJoined(true);
  };

  const handleLeaveDialogClose = () => {
    setIsLeaveDialogOpen(false);
  };

  return (
    <article className={s.card}>
      <div className={s.media}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.image} src={image} alt={title} loading="lazy" />
        <div className={s.tags}>
          <span className={clsx(s.tag, type === 'plan' ? s.plan : s.wish)}>
            {type}
          </span>
          {hashtag && <span className={clsx(s.tag, s.hashtag)}>{hashtag}</span>}
        </div>
      </div>

      <div className={s.body}>
        <div className={s.details}>
          <h2 className={s.title}>{title}</h2>

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
              <span className={s.username}>{host.username}</span>
              {host.mutualFriend && (
                <span className={s.muted}>· friend of {host.mutualFriend}</span>
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

        {participantCount > 0 ? (
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

        <button
          type="button"
          className={clsx(s.action, joined && s.joined)}
          onClick={handleActionClick}
        >
          {joined ? (
            <>
              <span className={s.selectedFace}>Interested</span>
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

      {isLeaveDialogOpen && (
        <div className={s.leaveOverlay}>
          <div className={s.leaveDialog} role="dialog">
            <h2 className={s.leaveDialogTitle}>Leave this event?</h2>
            <div className={s.leaveDialogActions}>
              <button
                type="button"
                className={s.noThanksButton}
                onClick={handleLeaveDialogClose}
              >
                <span>No, thanks</span>
              </button>
              <button
                type="button"
                className={s.leaveButton}
                onClick={handleLeaveDialogClose}
              >
                <span>Leave</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
