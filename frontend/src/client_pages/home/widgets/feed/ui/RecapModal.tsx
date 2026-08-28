'use client';

import { X } from '@shared/ui/icons';
import { AvatarImage } from '@shared/ui/avatarImage/AvatarImage';
import { EventImage } from '@shared/ui/eventImage/EventImage';
import { ProfileLink } from '@shared/ui/profileLink';
import { useBodyScrollLock } from '@/features';
import { useModalAttention } from '@shared/hooks/useModalAttention';
import { useModalTransition } from '@shared/hooks/useModalTransition';
import type { FeedEvent } from '@client_pages/home/model/types';
import s from './recapModal.module.scss';

type Props = {
  event: FeedEvent;
  onClose: () => void;
};

const MAX_VISIBLE_AVATARS = 6;

export const RecapModal = ({ event, onClose }: Props) => {
  const { requestClose, modalTransitionProps } = useModalTransition(onClose);
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
  const pulseModal = useModalAttention();

  const shownParticipants = participants.slice(0, MAX_VISIBLE_AVATARS);
  const extraCount = Math.max(0, participantCount - shownParticipants.length);

  return (
    <div {...modalTransitionProps} className={s.overlay} onClick={pulseModal}>
      <div
        data-modal-content
        className={s.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recapTitle"
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
                      {shownParticipants.map(participant => (
                        <ProfileLink
                          key={participant.username}
                          username={participant.username}
                          className={s.stackAvatar}
                        >
                          <AvatarImage
                            src={participant.avatar}
                            alt={participant.username}
                            loading="lazy"
                            fallbackWidth={28}
                            fallbackHeight={28}
                          />
                        </ProfileLink>
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

            <button
              type="button"
              className={s.backButton}
              onClick={requestClose}
            >
              <span>Back to profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
