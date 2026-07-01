'use client';

import { useEffect, useState } from 'react';
import { Avatar, X } from '@shared/ui/icons';
import { ProfileLink } from '@shared/ui/profileLink';
import { useBodyScrollLock } from '@/features';
import { listParticipants } from '@/shared/client_api/event';
import { toAbsoluteMediaUrl } from '@/shared/lib/mediaUrl';
import { handle } from '@client_pages/home/model/feedMapper';
import type { ParticipantAvatar } from '@client_pages/home/model/types';
import s from './participantsModal.module.scss';

type Props = {
  eventId: string;
  initialParticipants: ParticipantAvatar[];
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
  onClose,
}: Props) => {
  useBodyScrollLock();

  const [participants, setParticipants] =
    useState<ParticipantAvatar[]>(initialParticipants);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const isEmpty = !isLoading && !error && participants.length === 0;

  return (
    <div
      className={s.overlay}
      onClick={e => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className={s.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="participantsTitle"
        onClick={e => e.stopPropagation()}
      >
        <div className={s.header}>
          <div className={s.headerRow}>
            <h2 id="participantsTitle" className={s.title}>
              Who&apos;s going
            </h2>
            <button
              type="button"
              className={s.close}
              onClick={onClose}
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
            {participants.map((participant, index) => (
              <li key={index} className={s.row}>
                <span className={s.avatar}>
                  {participant.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={participant.avatar}
                      alt={participant.username}
                      loading="lazy"
                    />
                  ) : (
                    <Avatar width={48} height={48} />
                  )}
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
