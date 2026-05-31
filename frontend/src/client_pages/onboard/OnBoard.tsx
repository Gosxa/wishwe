'use client';

import { TrackProvider } from './model';
import s from './onBoard.module.scss';
import { Track } from './ui';

export const SCREEN_INDEX = {
  LOGIN_SCREEN: 0,
  ENTER_EMAIL: 1,
  VERIFY_EMAIL: 2,
  ENTER_PWD: 3,
  CREATE_PWD: 4,
  RESET_PWD: 5,
  PERSONAL_GOOGLE: 6,
  PERSONAL_MAIL: 7,
  DONE_ONBOARD: 8,
  DONE_RESET: 9,
} as const;

export const OnBoard = () => {
  return (
    <TrackProvider>
      <main className={s.container}>
        <picture>
          <img src="/onboard_image.jpg" alt="" className={s.image} />
        </picture>

        <Track />
      </main>
    </TrackProvider>
  );
};
