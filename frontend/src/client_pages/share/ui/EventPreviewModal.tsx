'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  Check,
  Location,
  Lock,
  UserPlus,
  UsersRound,
  X,
} from '@shared/ui/icons';
import { AvatarImage } from '@shared/ui/avatarImage/AvatarImage';
import { EventImage } from '@shared/ui/eventImage/EventImage';
import { ProfileLink } from '@shared/ui/profileLink';
import { useBodyScrollLock } from '@/features';
import { useModalAttention } from '@shared/hooks/useModalAttention';
import { useModalTransition } from '@shared/hooks/useModalTransition';
import { toAbsoluteMediaUrl } from '@/shared/lib/mediaUrl';
import type { EventPreview } from '@/shared/client_api/event';
import {
  SendFriendRequestError,
  sendFriendRequest,
} from '@/shared/client_api/user';
import type { FriendshipStatus } from '@/shared/client_api/user/types';
import { eventImage, handle } from '@client_pages/home/model/feedMapper';
import s from './eventPreviewModal.module.scss';

type Props = {
  preview: EventPreview;
  isAuthenticated: boolean;
  loginHref: string;
  friendshipStatus: FriendshipStatus | null;
  onClose: () => void;
};

type RequestState = 'idle' | 'pending' | 'sent' | 'failed';

const ALREADY_LINKED = /already/i;

export const EventPreviewModal = ({
  preview,
  isAuthenticated,
  loginHref,
  friendshipStatus,
  onClose,
}: Props) => {
  const { requestClose, modalTransitionProps } = useModalTransition(onClose);
  const { title, description, creator } = preview;

  const [request, setRequest] = useState<RequestState>(
    friendshipStatus === 'requested' ? 'sent' : 'idle',
  );

  useBodyScrollLock();
  const pulseModal = useModalAttention();

  const username = handle(creator.username);
  const avatar = toAbsoluteMediaUrl(creator.avatar);
  const cover = eventImage(preview.cover_image);
  const isSent = request === 'sent';

  const handleAddFriend = async () => {
    if (request === 'pending' || request === 'sent') {
      return;
    }

    setRequest('pending');

    try {
      await sendFriendRequest(creator.id);
      setRequest('sent');
    } catch (err: unknown) {
      const isDuplicate =
        err instanceof SendFriendRequestError &&
        ALREADY_LINKED.test(err.detail ?? '');

      setRequest(isDuplicate ? 'sent' : 'failed');
    }
  };

  return (
    <div {...modalTransitionProps} className={s.overlay} onClick={pulseModal}>
      <div
        data-modal-content
        className={s.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sharedEventPreviewTitle"
      >
        <div className={s.body}>
          <button
            type="button"
            className={s.close}
            onClick={requestClose}
            aria-label="Close"
          >
            <X />
          </button>

          <div className={s.left}>
            <div className={s.cover}>
              <EventImage src={cover} alt={title} />
              <span className={s.privacyPill}>
                <Lock width={14} height={14} />
                <span>Private event</span>
              </span>
            </div>

            <div className={s.hostCard}>
              <span className={s.hostAvatar}>
                <AvatarImage
                  src={avatar}
                  alt={username}
                  fallbackWidth={40}
                  fallbackHeight={40}
                />
              </span>
              <div className={s.hostText}>
                {isAuthenticated ? (
                  <ProfileLink username={username} className={s.hostName}>
                    {username}
                  </ProfileLink>
                ) : (
                  <span className={s.hostName}>{username}</span>
                )}
                <span className={s.hostSub}>shared this event with you</span>
              </div>
            </div>

            <div className={s.actions}>
              {!isAuthenticated ? (
                <Link href={loginHref} className={s.addFriend}>
                  <span>Login to your account</span>
                </Link>
              ) : isSent ? (
                <span className={s.requested}>
                  <Check />
                  <span>Requested</span>
                </span>
              ) : (
                <button
                  type="button"
                  className={s.addFriend}
                  onClick={handleAddFriend}
                  disabled={request === 'pending'}
                >
                  <UserPlus />
                  <span>Add friend</span>
                </button>
              )}

              {isAuthenticated && (
                <ProfileLink username={username} className={s.profileLink}>
                  See {username}&apos;s profile
                </ProfileLink>
              )}

              {isAuthenticated && request === 'failed' ? (
                <p className={s.error} role="alert">
                  Couldn&apos;t send the friend request. Please try again.
                </p>
              ) : (
                <p className={s.status}>
                  {!isAuthenticated
                    ? 'Log in or create an account to request access.'
                    : isSent
                      ? 'Request sent. The full event will open here as soon as you get access.'
                      : 'Connect with the host to request access to the full event.'}
                </p>
              )}
            </div>
          </div>

          <div className={s.right}>
            <h2 id="sharedEventPreviewTitle" className={s.title}>
              {title}
            </h2>

            <div className={s.divider} />

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

            <div className={s.locked}>
              <div className={s.lockedHeader}>
                <Lock />
                <span>
                  {!isAuthenticated
                    ? 'Log in to check your access'
                    : isSent
                      ? 'Still hidden — waiting for access'
                      : 'Hidden until you connect with the host'}
                </span>
              </div>

              <div className={s.redactedRow}>
                <CalendarClock />
                <span>Timeframe</span>
                <span className={s.redactedBar} />
              </div>
              <div className={s.redactedRow}>
                <Location />
                <span>Where</span>
                <span className={s.redactedBar} />
              </div>
              <div className={s.redactedRow}>
                <UsersRound />
                <span>Who is going</span>
                <span className={s.redactedBar} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
