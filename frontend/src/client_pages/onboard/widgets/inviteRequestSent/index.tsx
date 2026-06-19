'use client';

import { InviteRequestSentContent } from './ui/InviteRequestSentContent';
import s from './ui/inviteRequestSent.module.scss';

export const InviteRequestSent = () => (
  <div className={s.screen}>
    <InviteRequestSentContent />
  </div>
);
