'use client';

import { Screen } from '../../ui/screen/Screen';
import { getInviteHandle, type InviteContext } from '../../model/screensConfig';
import { useIntroContext } from '../../model';
import { useLoginScreen } from './model/useLoginScreen';
import { LoginScreenContent } from './ui';

const SCREEN_CONFIG = {
  h2: 'Get together, finally',
  headline: 'No random people. No noise. Just you and your inner circle',
} as const;

const COMPACT_QUERY = '(max-width: 1023px)';

type Props = {
  invite?: InviteContext;
};

export const LoginScreen = ({ invite }: Props) => {
  const { onGoogle, onEmail, googleError } = useLoginScreen();
  const { isStarted, start } = useIntroContext();
  const onPrimary = () => {
    if (!isStarted && window.matchMedia(COMPACT_QUERY).matches) {
      start();

      return;
    }

    onGoogle();
  };

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
        onPrimary={onPrimary}
        onEmail={onEmail}
        googleError={googleError}
        showJoinWithoutInvite={Boolean(invite)}
      />
    </Screen>
  );
};
