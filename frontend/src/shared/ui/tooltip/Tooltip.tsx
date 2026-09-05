import { type ReactNode } from 'react';
import clsx from 'clsx';
import s from './tooltip.module.scss';

type Props = {
  text?: string;
  id?: string;
  children: ReactNode;
  className?: string;
  open?: boolean;
};

export const Tooltip = ({ text, id, children, className, open }: Props) => {
  if (!text) return <>{children}</>;

  return (
    <span className={clsx(s.wrapper, className)} data-open={open}>
      {children}
      <span
        id={id}
        role="tooltip"
        className={s.bubble}
        aria-hidden={open === false}
      >
        {text}
      </span>
    </span>
  );
};
