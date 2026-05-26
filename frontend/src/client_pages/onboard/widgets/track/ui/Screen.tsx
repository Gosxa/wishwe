'use client';

import { useOnboardContext } from '../../../model';
import s from './screen.module.scss';

type Props = {
  index: number;
  h1: string;
  h1Suffix?: string;
  heading: string;
  children: React.ReactNode;
};

export const Screen = ({ index, h1, h1Suffix = '', heading, children }: Props) => {
  const { registerScreen } = useOnboardContext();

  return (
    <div ref={registerScreen(index)} className={s.screen}>
      <h1>{h1}{h1Suffix}</h1>
      <span className={s.heading}>{heading}</span>
      {children}
    </div>
  );
};
