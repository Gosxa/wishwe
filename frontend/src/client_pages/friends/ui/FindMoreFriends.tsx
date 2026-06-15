'use client';

import { Sparkles } from '@shared/ui/icons';
import { useInviteLink } from '@shared/hooks/useInviteLink';
import { Card } from './Card';
import s from './findMoreFriends.module.scss';

const LABELS = {
  idle: 'Copy link!',
  copying: 'Generating…',
  copied: 'Copied!',
  error: 'Try again',
} as const;

export const FindMoreFriends = () => {
  const { copy, status } = useInviteLink();

  return (
    <Card title="Find more friends">
      <p className={s.text}>
        Share your unique link with friends so they can find your profile and
        join you.
      </p>
      <button
        type="button"
        className={s.copyButton}
        onClick={copy}
        disabled={status === 'copying'}
      >
        <span>{LABELS[status]}</span>
        <Sparkles />
      </button>
    </Card>
  );
};
