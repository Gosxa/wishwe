'use client';

import { useEffect } from 'react';
import { Avatar, X } from '@shared/ui/icons';
import { useBodyScrollLock } from '@/features';
import type { FeedEvent } from '@client_pages/home/model/types';
import s from './recapModal.module.scss';

type Props = {
  event: FeedEvent;
  onClose: () => void;
};

const MAX_VISIBLE_AVATARS = 3;

export const RecapModal = ({ event, onClose }: Props) => {
  const {
    image,
    title,
    date,
    location,
    description,
    participants,
    participantCount,
  } = event;

  useBodyScrollLock();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const shownParticipants = participants.slice(0, MAX_VISIBLE_AVATARS);
  const extraCount = Math.max(0, participantCount - shownParticipants.length);

  return (
    <div className={s.overlay}>
      <div
        className={s.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recapTitle"
      >
        <button
          type="button"
          className={s.close}
          onClick={onClose}
          aria-label="Close"
        >
          <X />
        </button>

        <div className={s.cover}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={title} />
        </div>

        <div className={s.body}>
          <h2 id="recapTitle" className={s.title}>
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
                <span className={s.fieldValue}>{location}</span>
              </div>

              <div className={s.field}>
                <span className={s.fieldLabel}>Description</span>
                {description ? (
                  <span className={s.fieldValue}>{description}</span>
                ) : (
                  <span className={s.muted}>No details added by the host.</span>
                )}
              </div>

              <div className={s.field}>
                <span className={s.fieldLabel}>Who was there:</span>
                {shownParticipants.length > 0 ? (
                  <div className={s.attendees}>
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
                    {extraCount > 0 && (
                      <span className={s.extra}>+{extraCount}</span>
                    )}
                  </div>
                ) : (
                  <span className={s.muted}>No attendees recorded.</span>
                )}
              </div>
            </div>

            <button type="button" className={s.backButton} onClick={onClose}>
              <span>Back to profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
