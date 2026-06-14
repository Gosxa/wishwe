import clsx from 'clsx';
import { type ChangeEvent } from 'react';
import { Asterisk } from '../icons';
import { HelperText } from '../helperText/HelperText';
import s from './textArea.module.scss';

type Props = {
  id: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: () => void;
  required?: boolean;
  helperText?: string;
  error?: string;
  isSuccess?: boolean;
  maxLength?: number;
  showCounter?: boolean;
  rows?: number;
};

export const TextArea = ({
  id,
  label,
  placeholder = ' ',
  value,
  onChange,
  onBlur,
  required = false,
  helperText,
  error,
  isSuccess = false,
  maxLength,
  showCounter = false,
  rows = 3,
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
      <div className={s.textareaWrapper}>
        <textarea
          id={id}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          maxLength={maxLength}
          rows={rows}
          className={clsx(
            s.textarea,
            error && s.textareaError,
            isSuccess && s.textareaSuccess,
          )}
        />
        {helperContent && <HelperText text={helperContent} type={helperType} />}
        {showCounter && maxLength != null && (
          <span
            className={clsx(
              s.counter,
              value.length > maxLength && s.counterOver,
            )}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
};
