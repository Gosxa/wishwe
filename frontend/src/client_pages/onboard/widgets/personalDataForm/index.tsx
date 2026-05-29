'use client';

import { SCREEN_INDEX, useOnboardDataStore } from '../../model';
import { Screen } from '../../ui';
import { usePersonalData } from './model/usePersonalData';
import { PersonalDataContent } from './ui/PersonalDataContent';

const SCREEN_CONFIG = {
  h2: 'Your profile',
  headline: 'Tell us a bit about yourself.',
} as const;

const SCREEN_CONFIG_GOOGLE = {
  h2: 'Is this you?',
  headline: `We've pulled your info from Google. Make sure it looks right before joining the circle.`,
} as const;

export const PersonalDataForm = () => {
  const { avatar, nickname, firstName, lastName, submit } = usePersonalData();
  const authMethod = useOnboardDataStore(s => s.authMethod);

  const conf = authMethod === 'google' ? SCREEN_CONFIG_GOOGLE : SCREEN_CONFIG;

  return (
    <Screen index={SCREEN_INDEX.PERSONAL_DATA} {...conf}>
      <PersonalDataContent
        avatar={avatar}
        nickname={nickname}
        firstName={firstName}
        lastName={lastName}
        submit={submit}
      />
    </Screen>
  );
};
