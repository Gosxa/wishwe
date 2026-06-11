import clsx from 'clsx';
import { BadgeInfo, BadgeError, BadgeSuccess } from '../icons/badge';
import s from './helperText.module.scss';

type Props = {
  text: string;
  type?: 'info' | 'success' | 'error';
  // variant for helpers outside a positioned input wrapper
  inline?: boolean;
};

const badge = {
  info: <BadgeInfo />,
  success: <BadgeSuccess />,
  error: <BadgeError />,
};

export const HelperText = ({ text, type = 'info', inline = false }: Props) => (
  <div className={clsx(s.container, inline && s.inline)}>
    {badge[type]}
    <span className={clsx(s.text, s[type])}>{text}</span>
  </div>
);
