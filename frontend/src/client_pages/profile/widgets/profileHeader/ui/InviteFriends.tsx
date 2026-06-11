'use client';

import { Sparkles } from '@shared/ui/icons';
import { useInviteLink } from '@client_pages/profile/model/useInviteLink';
import s from './profileHeader.module.scss';

const LABELS = {
  idle: 'Copy link!',
  copying: 'Generating…',
  copied: 'Copied!',
  error: 'Try again',
} as const;

export const InviteFriends = () => {
  const { copy, status } = useInviteLink();

  return (
    <div className={s.invite}>
      <h2 className={s.inviteTitle}>Invite friends</h2>
      <p className={s.inviteText}>
        Copy your profile link and share it with friends to connect with you.
      </p>

      <button
        type="button"
        className={s.copyButton}
        onClick={copy}
        disabled={status === 'copying'}
      >
        <Sparkles />
        <span>{LABELS[status]}</span>
      </button>
    </div>
  );
};
