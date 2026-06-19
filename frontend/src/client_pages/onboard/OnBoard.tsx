'use client';

import { AuthLayout } from '@/shared';
import { TrackProvider, InviteProvider } from './model';
import type { InviteContext } from './model/screensConfig';
import { Track } from './ui';

type Props = {
  invite?: InviteContext;
};

export const OnBoard = ({ invite }: Props) => {
  return (
    <TrackProvider>
      <InviteProvider invite={invite}>
        <AuthLayout>
          <Track invite={invite} />
        </AuthLayout>
      </InviteProvider>
    </TrackProvider>
  );
};
