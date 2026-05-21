'use client';

import s from './onBoardScreen.module.scss';

type Props = {
  h1: string;
  heading: string;
  children: React.ReactNode;
};

export const OnBoardScreen: React.FC<Props> = ({ h1, heading, children }) => {
  return (
    <div className={s.container}>
      <h1>{h1}</h1>
      <span className={s.heading}>{heading}</span>
      {children}
    </div>
  );
};
