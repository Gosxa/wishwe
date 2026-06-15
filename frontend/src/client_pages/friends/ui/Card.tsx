import type { ReactNode } from 'react';
import s from './card.module.scss';

type Props = {
  title: string;
  children: ReactNode;
};

export const Card = ({ title, children }: Props) => (
  <section className={s.card}>
    <h2 className={s.title}>{title}</h2>
    {children}
  </section>
);
