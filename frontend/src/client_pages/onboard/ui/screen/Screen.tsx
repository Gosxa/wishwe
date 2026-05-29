'use client';

import { useTrackContext } from '../../model';
import s from './screen.module.scss';

type Props = {
  index: number;
  h2: string;
  h2Suffix?: string;
  headline: string;
  children: React.ReactNode;
};

export const Screen = ({
  index,
  h2,
  h2Suffix = '',
  headline,
  children,
}: Props) => {
  const { registerScreen } = useTrackContext();

  return (
    <div ref={registerScreen(index)} className={s.screen}>
      <h2>
        {h2}
        {h2Suffix}
      </h2>
      <span className={s.headline}>{headline}</span>
      {children}
    </div>
  );
};
