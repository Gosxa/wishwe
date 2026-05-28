'use client';

import { Spinner } from '@/shared';
import { useTrackContext, useOnboardDataStore } from '../../model';
import s from './track.module.scss';

type Props = {
  children: React.ReactNode;
};

export const Track = ({ children }: Props) => {
  const { VPRef } = useTrackContext();
  const isLoading = useOnboardDataStore(s => s.isLoading);

  return (
    <div className={s.inner}>
      <div className={s.viewport}>
        <div
          ref={el => {
            VPRef.current = el;
          }}
          className={s.track}
        >
          {children}
        </div>
      </div>
      {isLoading && <Spinner />}
    </div>
  );
};
