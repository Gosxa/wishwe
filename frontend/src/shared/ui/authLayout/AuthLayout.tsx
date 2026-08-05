import type { ReactNode } from 'react';

import s from './authLayout.module.scss';

type Props = {
  children: ReactNode;
  expanded?: boolean;
  overlay?: ReactNode;
  contentOverlay?: ReactNode;
};

export const AuthLayout = ({
  children,
  expanded = true,
  overlay,
  contentOverlay,
}: Props) => (
  <main className={s.container} data-auth-expanded={expanded}>
    <picture className={s.picture}>
      <img src="/onboard_image.jpg" alt="" className={s.image} />
    </picture>
    {!!overlay && <div className={s.overlay}>{overlay}</div>}
    <div className={s.content}>
      <div className={s.contentScroller}>{children}</div>
      {contentOverlay}
    </div>
  </main>
);
