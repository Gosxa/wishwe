'use client';

import s from './screen.module.scss';

type Props = {
  h2: string;
  h2Suffix?: string;
  headline: string;
  children: React.ReactNode;
};

export const Screen = ({ h2, h2Suffix = '', headline, children }: Props) => (
  <div className={s.screen}>
    <h2>
      {h2}
      {h2Suffix}
    </h2>
    <span className={s.headline}>{headline}</span>
    {children}
  </div>
);
