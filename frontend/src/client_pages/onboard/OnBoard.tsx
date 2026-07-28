'use client';

import { AuthLayout } from '@/shared';
import {
  TrackProvider,
  InviteProvider,
  NextPathProvider,
  IntroProvider,
  useIntroContext,
  useTrackContext,
} from './model';
import type { InviteContext } from './model/screensConfig';
import { Track } from './ui';

type Props = {
  invite?: InviteContext;
  next?: string | null;
};

// Past the first screen the sheet is always expanded, so resizing a desktop
// window down to phone width mid-flow does not drop back to the intro.
const OnBoardShell = ({ invite }: Pick<Props, 'invite'>) => {
  const { isStarted } = useIntroContext();
  const { pointer } = useTrackContext();

  return (
    <AuthLayout expanded={isStarted || pointer > 0}>
      <Track invite={invite} />
    </AuthLayout>
  );
};

export const OnBoard = ({ invite, next }: Props) => {
  return (
    <TrackProvider>
      <InviteProvider invite={invite}>
        <NextPathProvider next={next}>
          <IntroProvider>
            <OnBoardShell invite={invite} />
          </IntroProvider>
        </NextPathProvider>
      </InviteProvider>
    </TrackProvider>
  );
};
