'use client';

import { Screen } from '../../ui/screen/Screen';
import { getInviteHandle, type InviteContext } from '../../model/screensConfig';
import { useLoginScreen } from './model/useLoginScreen';
import { LoginScreenContent } from './ui';

const SCREEN_CONFIG = {
  h2: 'Get together, finally',
  headline: 'No random people. No noise. Just you and your inner circle',
} as const;

type Props = {
  invite?: InviteContext;
};

export const LoginScreen = ({ invite }: Props) => {
  const { onGoogle, onEmail, googleError } = useLoginScreen();
  const screenConfig = invite
    ? {
        h2: `Join ${getInviteHandle(invite.username)} on wish.we`,
        headline:
          'You’re one step away from their inner circle. sign up to start planning together.',
      }
    : SCREEN_CONFIG;

  return (
    <Screen {...screenConfig}>
      <LoginScreenContent
        onGoogle={onGoogle}
        onEmail={onEmail}
        googleError={googleError}
        showJoinWithoutInvite={Boolean(invite)}
      />
    </Screen>
  );
};
