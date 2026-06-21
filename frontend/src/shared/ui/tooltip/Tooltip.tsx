import { type ReactNode } from 'react';
import clsx from 'clsx';
import s from './tooltip.module.scss';

type Props = {
  text?: string;
  id?: string;
  children: ReactNode;
  className?: string;
};

export const Tooltip = ({ text, id, children, className }: Props) => {
  if (!text) return <>{children}</>;

  return (
    <span className={clsx(s.wrapper, className)}>
      {children}
      <span id={id} role="tooltip" className={s.bubble}>
        {text}
      </span>
    </span>
  );
};
