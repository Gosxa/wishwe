import type { ReactNode } from 'react';

import s from './authLayout.module.scss';

type Props = {
  children: ReactNode;
};

export const AuthLayout = ({ children }: Props) => (
  <main className={s.container}>
    <picture className={s.picture}>
      <img src="/onboard_image.jpg" alt="" className={s.image} />
    </picture>
    <div className={s.content}>{children}</div>
  </main>
);
