'use client';

import s from './onBoard.module.scss';

export const OnBoard = () => {
  return (
    <main className={s.container}>
      <picture>
        <img src="/onboard_image.jpg" alt="" />
      </picture>
      <div className={s.inner}></div>
    </main>
  );
};
