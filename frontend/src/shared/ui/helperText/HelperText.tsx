import clsx from 'clsx';
import { BadgeInfo, BadgeError, BadgeSuccess } from '../icons/badge';
import s from './helperText.module.scss';

type Props = {
  text: string;
  type?: 'info' | 'success' | 'error';
};

const badge = {
  info: <BadgeInfo />,
  success: <BadgeSuccess />,
  error: <BadgeError />,
};

export const HelperText = ({ text, type = 'info' }: Props) => (
  <div className={s.container}>
    {badge[type]}
    <span className={clsx(s.text, s[type])}>{text}</span>
  </div>
);
