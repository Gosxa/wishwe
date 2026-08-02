'use client';

import {
  type VerifyEmailVariant,
  useRegisterBack,
  SCREEN_ID,
} from '../../model';
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

  useRegisterBack(
    variant === 'reset' ? SCREEN_ID.VERIFY_RESET : SCREEN_ID.VERIFY_REGISTER,
    { label: back.label, onBack: back.onBack },
  );

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
