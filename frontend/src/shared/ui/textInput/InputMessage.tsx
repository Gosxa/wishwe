import { type ReactNode } from 'react';
import { BadgeError, BadgeInfo } from '../icons';
import s from './textInput.module.scss';

export type MessageType = 'helper' | 'error' | 'success';

const typeClass: Record<MessageType, string> = {
  helper: s.messageHelper,
  error: s.messageError,
  success: s.messageSuccess,
};

const typeIcon: Partial<Record<MessageType, ReactNode>> = {
  helper: <BadgeInfo />,
  error: <BadgeError />,
};

type Props = {
  type: MessageType;
  text: string;
};

export const InputMessage = ({ type, text }: Props) => (
  <span className={`${s.message} ${typeClass[type]}`}>
    {typeIcon[type]}
    {text}
  </span>
);
