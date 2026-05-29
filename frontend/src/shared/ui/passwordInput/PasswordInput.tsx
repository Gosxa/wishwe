'use client';

import { useState, type ChangeEvent } from 'react';
import clsx from 'clsx';
import { EyeOpen, EyeClosed } from '../icons';
import { HelperText } from '../helperText/HelperText';
import ts from '../textInput/textInput.module.scss';
import s from './passwordInput.module.scss';

type Props = {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  helperText?: string;
  error?: string;
  isSuccess?: boolean;
};

export const PasswordInput = ({
  id,
  label,
  placeholder = 'Password',
  value,
  onChange,
  onBlur,
  helperText,
  error,
  isSuccess = false,
}: Props) => {
  const [show, setShow] = useState(false);

  const helperContent = error ?? helperText;
  const helperType = error ? 'error' : isSuccess ? 'success' : 'info';

  return (
    <div className={ts.wrapper}>
      <label htmlFor={id}>{label}</label>
      <div className={ts.inputWrapper}>
        <div className={s.wrap}>
          <input
            id={id}
            type={show ? 'text' : 'password'}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            className={clsx(
              ts.input,
              error && ts.inputError,
              isSuccess && ts.inputSuccess,
            )}
          />
          <button
            type="button"
            className={s.eyeBtn}
            onClick={() => setShow(v => !v)}
            tabIndex={-1}
          >
            {show ? <EyeClosed /> : <EyeOpen />}
          </button>
        </div>
        {helperContent && <HelperText text={helperContent} type={helperType} />}
      </div>
    </div>
  );
};
