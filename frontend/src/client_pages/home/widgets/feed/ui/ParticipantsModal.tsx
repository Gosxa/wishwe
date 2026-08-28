'use client';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { X } from '@shared/ui/icons';
import { AvatarImage } from '@shared/ui/avatarImage/AvatarImage';
import { ProfileLink } from '@shared/ui/profileLink';
import { useBodyScrollLock } from '@/features';
import { useModalAttention } from '@shared/hooks/useModalAttention';
import { useModalTransition } from '@shared/hooks/useModalTransition';
import { listParticipants } from '@/shared/client_api/event';
import { toAbsoluteMediaUrl } from '@/shared/lib/mediaUrl';
import { handle } from '@client_pages/home/model/feedMapper';
import type { ParticipantAvatar } from '@client_pages/home/model/types';
import s from './participantsModal.module.scss';

type Props = {
  eventId: string;
  initialParticipants: ParticipantAvatar[];
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
};

const toParticipant = (participant: {
  username: string | null;
  avatar: string | null;
}): ParticipantAvatar => ({
  username: handle(participant.username),
  avatar: toAbsoluteMediaUrl(participant.avatar),
});

export const ParticipantsModal = ({
  eventId,
  initialParticipants,
  returnFocusRef,
  onClose,
}: Props) => {
  useBodyScrollLock();
  const pulseModal = useModalAttention();
  const { requestClose, modalTransitionProps } = useModalTransition(onClose);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [participants, setParticipants] =
    useState<ParticipantAvatar[]>(initialParticipants);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const returnFocus = returnFocusRef.current;

    closeRef.current?.focus();

    return () => returnFocus?.focus();
  }, [returnFocusRef]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await listParticipants(eventId);

        if (cancelled) return;

        setParticipants(data.map(toParticipant));
        setError(null);
      } catch {
        if (cancelled) return;
        setError('Could not load participants. Please try again later.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const isEmpty = !isLoading && !error && participants.length === 0;

  return (
    <div {...modalTransitionProps} className={s.overlay} onClick={pulseModal}>
      <div
        data-modal-content
        className={s.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="participantsTitle"
      >
        <div className={s.header}>
          <div className={s.headerRow}>
            <h2 id="participantsTitle" className={s.title}>
              Who&apos;s going
            </h2>
            <button
              ref={closeRef}
              type="button"
              className={s.close}
              onClick={requestClose}
              aria-label="Close"
            >
              <X />
            </button>
          </div>
          <div className={s.divider} />
        </div>

        {isLoading ? (
          <p className={s.status}>Loading...</p>
        ) : error ? (
          <p className={s.status}>{error}</p>
        ) : isEmpty ? (
          <p className={s.status}>No one has joined yet.</p>
        ) : (
          <ul className={s.list}>
            {participants.map(participant => (
              <li key={participant.username} className={s.row}>
                <span className={s.avatar}>
                  <AvatarImage
                    src={participant.avatar}
                    alt={participant.username}
                    loading="lazy"
                    fallbackWidth={48}
                    fallbackHeight={48}
                  />
                </span>
                <ProfileLink
                  username={participant.username}
                  className={s.username}
                >
                  {participant.username}
                </ProfileLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
