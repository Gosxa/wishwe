'use client';

import { Screen } from '../../ui';
import { LoginPassword } from './ui';
import { useLoginPassword } from './model';

const SCREEN_CONFIG = {
  h2: 'Enter your password',
  headline: 'Enter your password to log in to your account',
} as const;

export const EnterPasswordForm = () => {
  const { input, submit, forgot } = useLoginPassword();

  return (
    <Screen {...SCREEN_CONFIG}>
      <LoginPassword input={input} submit={submit} forgot={forgot} />
    </Screen>
  );
};
