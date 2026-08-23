import type { ReactNode } from 'react';
import Image from 'next/image';

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
    <div className={s.picture}>
      <Image
        src="/onboard_image.jpg"
        alt=""
        aria-hidden
        className={s.image}
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 50vw"
      />
    </div>
    {!!overlay && <div className={s.overlay}>{overlay}</div>}
    <div className={s.content}>
      <div className={s.contentScroller}>{children}</div>
      {contentOverlay}
    </div>
  </main>
);
