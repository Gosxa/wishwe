'use client';

import { AuthLayout, BackButton } from '@/shared';
import {
  TrackProvider,
  InviteProvider,
  NextPathProvider,
  IntroProvider,
  BackProvider,
  useActiveBackAction,
  useIntroContext,
  useTrackContext,
} from './model';
import type { InviteContext } from './model/screensConfig';
import { Track } from './ui';

type Props = {
  invite?: InviteContext;
  next?: string | null;
};

const OnBoardShell = ({ invite }: Pick<Props, 'invite'>) => {
  const { isStarted } = useIntroContext();
  const { screenStack, pointer } = useTrackContext();
  const backAction = useActiveBackAction(screenStack[pointer]);

  return (
    <AuthLayout
      expanded={isStarted || pointer > 0}
      overlay={
        backAction && (
          <BackButton label={backAction.label} onClick={backAction.onBack} />
        )
      }
    >
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
            <BackProvider>
              <OnBoardShell invite={invite} />
            </BackProvider>
          </IntroProvider>
        </NextPathProvider>
      </InviteProvider>
    </TrackProvider>
  );
};
