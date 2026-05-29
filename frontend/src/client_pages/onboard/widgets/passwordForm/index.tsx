'use client';

import { useOnboardDataStore, SCREEN_INDEX } from '../../model';
import { Screen } from '../../ui';
import { CreatePassword, LoginPassword } from './ui';

const SCREEN_CONFIG = {
  register: {
    h2: 'Create a password',
    headline: `Make sure it's secure and easy to remember.`,
  },
  login: {
    h2: 'Enter your password',
    headline: 'Enter your password to log in to your account',
  },
  reset: {
    h2: 'Create new password',
    headline: 'Please enter your new password below',
  },
} as const;

const BUTTON_CONFIG: Record<'register' | 'reset', string> = {
  register: 'Set password',
  reset: 'Update password',
};

export const PasswordForm = () => {
  const authFlow = useOnboardDataStore(s => s.authFlow);

  const content =
    authFlow === 'login' ? (
      <LoginPassword />
    ) : (
      <CreatePassword button={BUTTON_CONFIG[authFlow]} />
    );

  return (
    <Screen index={SCREEN_INDEX.PASSWORD_FORM} {...SCREEN_CONFIG[authFlow]}>
      {content}
    </Screen>
  );
};
