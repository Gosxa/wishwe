'use client';

import { SCREEN_INDEX, useOnboardDataStore } from '../../model';
import { Screen } from '../../ui';
import { DoneScreenContent } from './ui/DoneScreenContent';

const SCREEN_CONFIG_REGISTER = {
  h2: 'Welcome aboard,\n',
  headline:
    'Wish.we is all about sharing moments with your inner circle, add your friends now to see what they are planning.',
} as const;

const SCREEN_CONFIG_RESET = {
  h2: 'Congrats',
  headline: 'Password updated successfully',
} as const;

export const DoneScreen = () => {
  const authFlow = useOnboardDataStore(s => s.authFlow);
  const firstName = useOnboardDataStore(s => s.firstName);

  const isReset = authFlow === 'reset';
  const conf = isReset ? SCREEN_CONFIG_RESET : SCREEN_CONFIG_REGISTER;
  const h2Suffix = !isReset ? firstName : undefined;

  return (
    <Screen index={SCREEN_INDEX.DONE_SCREEN} {...conf} h2Suffix={h2Suffix}>
      <DoneScreenContent isReset={isReset} />
    </Screen>
  );
};
