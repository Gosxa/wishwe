'use client';

import { type PersonalDataVariant } from '../../model';
import { Screen } from '../../ui';
import { usePersonalData } from './model/usePersonalData';
import { PersonalDataContent } from './ui/PersonalDataContent';

type Props = {
  variant: PersonalDataVariant;
};

const SCREEN_CONFIG: Record<
  PersonalDataVariant,
  { h2: string; headline: string }
> = {
  email: {
    h2: 'Complete your profile',
    headline: `Choose how you'll appear to your friends before joining the circle.`,
  },
  google: {
    h2: 'Is this you?',
    headline: `We've pulled your info from Google. Make sure it looks right before joining the circle.`,
  },
};

export const PersonalDataForm = ({ variant }: Props) => {
  const { avatar, nickname, firstName, lastName, submit } =
    usePersonalData(variant);

  return (
    <Screen {...SCREEN_CONFIG[variant]}>
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
