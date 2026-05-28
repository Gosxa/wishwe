'use client';

import { Screen } from '../../ui/screen/Screen';
import { useLoginScreen } from './model/useLoginScreen';
import { LoginScreenContent } from './ui';

const config = {
  index: 0,
  h2: 'Get together, finally',
  headline: 'No random people. No noise. Just you and your inner circle',
};

export const LoginScreen = () => {
  const { onGoogle, onEmail, googleError } = useLoginScreen();

  return (
    <Screen {...config}>
      <LoginScreenContent
        onGoogle={onGoogle}
        onEmail={onEmail}
        googleError={googleError}
      />
    </Screen>
  );
};
