import clsx from 'clsx';
import { type ChangeEvent } from 'react';
import { Asterisk } from '../icons';
import { HelperText } from '../helperText/HelperText';
import s from './textInput.module.scss';

type Props = {
  id: string;
  label?: string;
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
  const helperContent = error ?? helperText;
  const helperType = error ? 'error' : isSuccess ? 'success' : 'info';

  return (
    <div className={s.wrapper}>
      {(label || required) && (
        <label htmlFor={id}>
          {label}
          {required && <Asterisk />}
        </label>
      )}
      <div className={s.inputWrapper}>
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
        {helperContent && <HelperText text={helperContent} type={helperType} />}
      </div>
    </div>
  );
};
