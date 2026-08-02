'use client';

import { Screen } from '../../ui';
import {
  getInviteHandle,
  useInviteContext,
  useRegisterBack,
  SCREEN_ID,
} from '../../model';
import { useEnterEmail } from './model/useEnterEmail';
import { EnterEmailContent } from './ui/EnterEmailContent';

const SCREEN_CONFIG = {
  h2: 'Enter your email',
  headline: `We'll get you started or sign you back in.`,
} as const;

export const EnterEmail = () => {
  const { input, submit, back } = useEnterEmail();
  const invite = useInviteContext();

  useRegisterBack(SCREEN_ID.ENTER_EMAIL, {
    label: 'Back to login',
    onBack: back.onBack,
  });

  const screenConfig = invite
    ? {
        h2: 'Enter your email',
        headline: `Enter your email to join ${getInviteHandle(invite.username)} on wish.we.`,
      }
    : SCREEN_CONFIG;

  return (
    <Screen {...screenConfig}>
      <EnterEmailContent input={input} submit={submit} back={back} />
    </Screen>
  );
};
