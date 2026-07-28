'use client';

import { AuthLayout } from '@/shared';
import { TrackProvider, InviteProvider, NextPathProvider } from './model';
import type { InviteContext } from './model/screensConfig';
import { Track } from './ui';

type Props = {
  invite?: InviteContext;
  next?: string | null;
};

export const OnBoard = ({ invite, next }: Props) => {
  return (
    <TrackProvider>
      <InviteProvider invite={invite}>
        <NextPathProvider next={next}>
          <AuthLayout>
            <Track invite={invite} />
          </AuthLayout>
        </NextPathProvider>
      </InviteProvider>
    </TrackProvider>
  );
};
