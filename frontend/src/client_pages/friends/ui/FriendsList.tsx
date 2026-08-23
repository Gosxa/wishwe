import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Spinner } from '@/shared';
import { UserX } from '@shared/ui/icons';
import { Card } from './Card';
import { PersonRow } from './PersonRow';
import { UnfriendModal } from './UnfriendModal';
import type { Friend } from '../model/types';
import s from './friendsList.module.scss';

type Props = {
  friends: Friend[];
  query: string;
  isLoading: boolean;
  onRemove: (friendshipId: number) => void;
};

export const FriendsList = ({ friends, query, isLoading, onRemove }: Props) => {
  const [pending, setPending] = useState<Friend | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return friends;

    return friends.filter(friend => friend.username.toLowerCase().includes(q));
  }, [friends, query]);

  let body;

  if (isLoading) {
    body = (
      <div className={s.status}>
        <Spinner />
      </div>
    );
  } else if (friends.length === 0 && !query.trim()) {
    body = (
      <div className={s.empty}>
        <p className={s.emptyText}>
          Your friend list is currently empty. Share your profile link or search
          for people you know to get started.
        </p>
        <Image
          src="/friends-empty.png"
          alt=""
          aria-hidden
          className={s.illustration}
          width={376}
          height={170}
          loading="eager"
          sizes="(max-width: 440px) 100vw, 376px"
        />
      </div>
    );
  } else if (filtered.length === 0) {
    body = <p className={s.noMatch}>No friends match your search.</p>;
  } else {
    body = (
      <ul className={s.list}>
        {filtered.map(friend => (
          <PersonRow
            key={friend.friendshipId}
            username={friend.username}
            avatar={friend.avatar}
          >
            <button
              type="button"
              className={s.unfriend}
              aria-label={`Remove @${friend.username}`}
              title={`Remove @${friend.username}`}
              onClick={() => setPending(friend)}
            >
              <UserX />
            </button>
          </PersonRow>
        ))}
      </ul>
    );
  }

  return (
    <>
      <Card title="Your friends">{body}</Card>
      {pending && (
        <UnfriendModal
          username={pending.username}
          onCancel={() => setPending(null)}
          onConfirm={() => onRemove(pending.friendshipId)}
        />
      )}
    </>
  );
};
