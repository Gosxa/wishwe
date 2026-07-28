'use client';

import {
  useOnboardDataStore,
  useNextPath,
  DoneScreenVariant,
} from '../../model';
import { Screen } from '../../ui';
import { DoneScreenContent } from './ui/DoneScreenContent';

type Props = {
  variant: DoneScreenVariant;
};

const SCREEN_CONFIG: Record<
  DoneScreenVariant,
  { h2: string; headline: string }
> = {
  create: {
    h2: 'Welcome aboard,\n',
    headline:
      'WishWe is all about sharing moments with your inner circle, add your friends now to see what they are planning.',
  },
  reset: {
    h2: 'Congrats',
    headline: 'Password updated successfully',
  },
};

export const DoneScreen = ({ variant }: Props) => {
  const firstName = useOnboardDataStore(s => s.firstName);
  const nextPath = useNextPath();

  return (
    <Screen
      {...SCREEN_CONFIG[variant]}
      h2Suffix={variant === 'create' ? firstName : undefined}
    >
      <DoneScreenContent variant={variant} feedHref={nextPath ?? '/feed'} />
    </Screen>
  );
};
