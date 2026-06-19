'use client';

import { Screen } from '../../ui';
import { getInviteHandle, useInviteContext } from '../../model';
import { LoginPassword } from './ui';
import { useLoginPassword } from './model';

const SCREEN_CONFIG = {
  h2: 'Enter your password',
  headline: 'Enter your password to log in to your account',
} as const;

export const EnterPasswordForm = () => {
  const { input, submit, forgot } = useLoginPassword();
  const invite = useInviteContext();

  const screenConfig = invite
    ? {
        h2: 'Enter your password',
        headline: `Log in to your account to connect with ${getInviteHandle(invite.username)}`,
      }
    : SCREEN_CONFIG;

  return (
    <Screen {...screenConfig}>
      <LoginPassword
        input={input}
        submit={submit}
        forgot={forgot}
        submitLabel={invite ? 'Log in & join' : 'Log in'}
      />
    </Screen>
  );
};
