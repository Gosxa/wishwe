'use client';

import { SCREEN_INDEX } from '../../model';
import { Screen } from '../../ui';
import { useVerifyEmail } from './model/useVerifyEmail';
import { VerifyEmailContent } from './ui/VerifyEmailContent';

const SCREEN_CONFIG = {
  h2: 'Check your email',
} as const;

export const VerifyEmail = () => {
  const { cells, submit, back, resend, email } = useVerifyEmail();

  return (
    <Screen
      index={SCREEN_INDEX.VERIFY_EMAIL}
      {...SCREEN_CONFIG}
      headline={`Enter the 6-digit code we sent to ${email}`}
    >
      <VerifyEmailContent
        cells={cells}
        submit={submit}
        back={back}
        resend={resend}
      />
    </Screen>
  );
};
