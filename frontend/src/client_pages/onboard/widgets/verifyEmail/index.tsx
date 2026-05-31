'use client';

import { type VerifyEmailVariant } from '../../model';
import { Screen } from '../../ui';
import { useVerifyEmail } from './model/useVerifyEmail';
import { VerifyEmailContent } from './ui/VerifyEmailContent';

type Props = {
  variant: VerifyEmailVariant;
};

const SCREEN_CONFIG = {
  h2: 'Check your email',
} as const;

export const VerifyEmail = ({ variant }: Props) => {
  const { cells, submit, back, resend, email } = useVerifyEmail(variant);

  return (
    <Screen
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
