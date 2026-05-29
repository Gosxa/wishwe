'use client';

import { SCREEN_INDEX } from '../../model';
import { Screen } from '../../ui';
import { useEnterEmail } from './model/useEnterEmail';
import { EnterEmailContent } from './ui/EnterEmailContent';

const SCREEN_CONFIG = {
  h2: 'Enter your email',
  headline: `We'll get you started or sign you back in.`,
} as const;

export const EnterEmail = () => {
  const { input, submit, back } = useEnterEmail();

  return (
    <Screen index={SCREEN_INDEX.ENTER_EMAIL} {...SCREEN_CONFIG}>
      <EnterEmailContent input={input} submit={submit} back={back} />
    </Screen>
  );
};
