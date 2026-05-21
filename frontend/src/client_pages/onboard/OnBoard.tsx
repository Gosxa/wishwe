'use client';

import s from './onBoard.module.scss';
import { LoginScreen, RegisterGoogle } from './ui';

export const OnBoard = () => {
  return (
    <main className={s.container}>
      <picture>
        <img src="/onboard_image.jpg" alt="" className={s.image} />
      </picture>
      <div className={s.inner}>
        <RegisterGoogle />
      </div>
    </main>
  );
};
