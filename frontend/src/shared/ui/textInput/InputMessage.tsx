import s from './textInput.module.scss';

export type MessageType = 'helper' | 'error' | 'success';

const typeClass: Record<MessageType, string> = {
  helper: s.messageHelper,
  error: s.messageError,
  success: s.messageSuccess,
};

type Props = {
  type: MessageType;
  text: string;
};

export const InputMessage = ({ type, text }: Props) => (
  <span className={`${s.message} ${typeClass[type]}`}>{text}</span>
);
