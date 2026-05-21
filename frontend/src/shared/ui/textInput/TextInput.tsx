import clsx from 'clsx';
import { type ChangeEvent } from 'react';
import { Asterisk } from '../icons';
import { InputMessage } from './InputMessage';
import s from './textInput.module.scss';

type Props = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  required?: boolean;
  helperText?: string;
  error?: string;
  isSuccess?: boolean;
};

export const TextInput = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  required = false,
  helperText,
  error,
  isSuccess = false,
}: Props) => {
  const message = error
    ? { type: 'error' as const, text: error }
    : helperText
      ? { type: 'helper' as const, text: helperText }
      : null;

  return (
    <div className={s.wrapper}>
      <label htmlFor={id}>
        {label}
        {required && <Asterisk />}
      </label>
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={clsx(
          s.input,
          error && s.inputError,
          isSuccess && s.inputSuccess,
        )}
      />
      {message && <InputMessage type={message.type} text={message.text} />}
    </div>
  );
};
