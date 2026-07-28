import type { ReactNode } from 'react';

import s from './authLayout.module.scss';

type Props = {
  children: ReactNode;
  expanded?: boolean;
};

export const AuthLayout = ({ children, expanded = true }: Props) => (
  <main className={s.container} data-auth-expanded={expanded}>
    <picture className={s.picture}>
      <img src="/onboard_image.jpg" alt="" className={s.image} />
    </picture>
    <div className={s.content}>{children}</div>
  </main>
);
