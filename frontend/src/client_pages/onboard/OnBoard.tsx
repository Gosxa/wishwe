'use client';

import { AuthLayout, BackButton, Spinner } from '@/shared';
import { useLoadingStore } from '@/shared/store/useLoadingStore';
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
  const isLoading = useLoadingStore(s => s.isLoading);

  return (
    <AuthLayout
      expanded={isStarted || pointer > 0}
      contentOverlay={isLoading ? <Spinner compact /> : null}
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
