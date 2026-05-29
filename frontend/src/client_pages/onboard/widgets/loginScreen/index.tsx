'use client';

import { Screen } from '../../ui/screen/Screen';
import { useLoginScreen } from './model/useLoginScreen';
import { LoginScreenContent } from './ui';
import { SCREEN_INDEX } from '../../model';

const SCREEN_CONFIG = {
  h2: 'Get together, finally',
  headline: 'No random people. No noise. Just you and your inner circle',
} as const;

export const LoginScreen = () => {
  const { onGoogle, onEmail, googleError } = useLoginScreen();

  return (
    <Screen index={SCREEN_INDEX.LOGIN_SCREEN} {...SCREEN_CONFIG}>
      <LoginScreenContent
        onGoogle={onGoogle}
        onEmail={onEmail}
        googleError={googleError}
      />
    </Screen>
  );
};
