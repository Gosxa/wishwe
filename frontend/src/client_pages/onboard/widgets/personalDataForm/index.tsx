'use client';

import { type PersonalDataVariant, useInviteContext } from '../../model';
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

const INVITE_GOOGLE_CONFIG = {
  h2: 'Complete your profile',
  headline: `We've pulled your info from Google. Make sure it looks right before joining the circle.`,
} as const;

export const PersonalDataForm = ({ variant }: Props) => {
  const invite = useInviteContext();
  const { avatar, nickname, firstName, lastName, submit, submitError } =
    usePersonalData(variant);

  const screenConfig =
    invite && variant === 'google'
      ? INVITE_GOOGLE_CONFIG
      : SCREEN_CONFIG[variant];

  return (
    <Screen {...screenConfig}>
      <PersonalDataContent
        avatar={avatar}
        nickname={nickname}
        firstName={firstName}
        lastName={lastName}
        submit={submit}
        submitError={submitError}
        inviteLayout={Boolean(invite && variant === 'google')}
      />
    </Screen>
  );
};
