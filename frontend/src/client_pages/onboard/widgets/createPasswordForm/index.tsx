'use client';

import { Screen } from '../../ui';
import { CreatePasswordVariant } from '../../model';
import { CreatePassword } from './ui';

type Props = {
  variant: CreatePasswordVariant;
};

const SCREEN_CONF = {
  register: {
    h2: 'Create a password',
    headline: `Make sure it's secure and easy to remember.`,
  },
  reset: {
    h2: 'Create new password',
    headline: 'Please enter your new password below',
  },
} as const;

export const CreatePasswordForm = ({ variant }: Props) => {
  return (
    <Screen {...SCREEN_CONF[variant]}>
      <CreatePassword variant={variant} />
    </Screen>
  );
};
