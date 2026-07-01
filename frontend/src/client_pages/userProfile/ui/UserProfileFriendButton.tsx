'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  acceptRequest,
  declineRequest,
  listFriends,
  listIncomingRequests,
  removeFriend,
  sendFriendRequest,
} from '@/shared/client_api/user';
import type { FriendshipStatus } from '@/shared/client_api/user/types';
import { UnfriendModal } from '@client_pages/friends/ui/UnfriendModal';
import { X } from '@shared/ui/icons';
import f from './userProfileHeader.module.scss';

type Props = {
  userId: number;
  username: string;
  initialStatus: FriendshipStatus;
};

export const UserProfileFriendButton = ({
  userId,
  username,
  initialStatus,
}: Props) => {
  const [status, setStatus] = useState<FriendshipStatus>(initialStatus);
  const [isPending, setIsPending] = useState(false);
  const [showUnfriend, setShowUnfriend] = useState(false);

  const run = async (action: () => Promise<void>, next: FriendshipStatus) => {
    if (isPending) return;

    setIsPending(true);

    try {
      await action();
      setStatus(next);
    } catch {
      // keep the current status if the request fails
    } finally {
      setIsPending(false);
    }
  };

  const resolveIncomingId = async () => {
    const requests = await listIncomingRequests();
    const match = requests.find(request => request.sender === username);

    if (!match) throw new Error('Incoming request not found');

    return match.id;
  };

  const handleAdd = () => run(() => sendFriendRequest(userId), 'requested');

  const handleAccept = () =>
    run(async () => {
      await acceptRequest(await resolveIncomingId());
    }, 'friends');

  const handleDecline = () =>
    run(async () => {
      await declineRequest(await resolveIncomingId());
    }, 'none');

  const handleUnfriend = async () => {
    await run(async () => {
      const { results } = await listFriends(1, 1000);
      const match = results.find(friend => friend.username === username);

      if (!match) throw new Error('Friend not found');

      await removeFriend(match.friendship_id);
    }, 'none');

    setShowUnfriend(false);
  };

  if (status === 'self') {
    return (
      <Link href="/edit-profile" className={f.link}>
        <span>Edit profile</span>
      </Link>
    );
  }

  if (status === 'incoming_request') {
    return (
      <div className={f.actionRow}>
        <button
          type="button"
          className={f.accept}
          onClick={handleAccept}
          disabled={isPending}
        >
          <span>Accept</span>
        </button>
        <button
          type="button"
          className={f.decline}
          onClick={handleDecline}
          disabled={isPending}
        >
          <span>Decline</span>
        </button>
      </div>
    );
  }

  if (status === 'requested') {
    return (
      <button type="button" className={f.action} style={{ cursor: 'default' }}>
        <span>Requested</span>
      </button>
    );
  }

  if (status === 'friends') {
    return (
      <>
        <button
          type="button"
          className={f.friends}
          onClick={() => setShowUnfriend(true)}
          disabled={isPending}
        >
          <span className={f.defaultLabel}>You are friends</span>
          <span className={f.hoverLabel}>
            <X />
            Unfriend
          </span>
        </button>

        {showUnfriend && (
          <UnfriendModal
            username={username}
            onCancel={() => setShowUnfriend(false)}
            onConfirm={handleUnfriend}
          />
        )}
      </>
    );
  }

  // status === 'none'
  return (
    <button
      type="button"
      className={f.addFriend}
      onClick={handleAdd}
      disabled={isPending}
    >
      <span>Add friend</span>
    </button>
  );
};
