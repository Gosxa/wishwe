'use client';

import { useOnboardContext } from '../../model';
import { Screen } from './ui/Screen';
import s from './track.module.scss';

type Props = {
  children: React.ReactNode;
};

const TrackRoot = ({ children }: Props) => {
  const { VPRef } = useOnboardContext();

  return (
    <div className={s.viewport}>
      <div className={s.track} ref={VPRef}>
        {children}
      </div>
    </div>
  );
};

export const Track = Object.assign(TrackRoot, { Screen });
