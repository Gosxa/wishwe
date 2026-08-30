'use client';

import clsx from 'clsx';
import { type ChangeEvent, type ReactNode } from 'react';
import { useQuickFillWords } from '@/shared/store/useQuickFillStore';
import { Asterisk } from '../icons';
import { HelperText } from '../helperText/HelperText';
import { QuickFillOverlay } from '../quickFillOverlay/QuickFillOverlay';
import s from './textInput.module.scss';

type Props = {
  id: string;
  label?: string;
  placeholder: string;
  type?: 'text' | 'date' | 'url';
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  required?: boolean;
  helperText?: string;
  error?: string;
  isSuccess?: boolean;
  maxLength?: number;
  showCounter?: boolean;
  tourId?: string;
  labelAction?: ReactNode;
  statusRow?: ReactNode;
};

export const TextInput = ({
  id,
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  onBlur,
  required = false,
  helperText,
  error,
  isSuccess = false,
  maxLength,
  showCounter = false,
  tourId,
  labelAction,
  statusRow,
}: Props) => {
  const helperContent = error ?? helperText;
  const helperType = error ? 'error' : isSuccess ? 'success' : 'info';
  const quickFillWords = useQuickFillWords(tourId);

  return (
    <div className={s.wrapper} data-tour={tourId}>
      {(label || required || labelAction) && (
        <div className={clsx(s.labelRow, labelAction && s.labelRowWithAction)}>
          <label htmlFor={id}>
            {label}
            {required && <Asterisk />}
          </label>
          {labelAction}
        </div>
      )}
      <div className={s.inputWrapper}>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          maxLength={maxLength}
          className={clsx(
            s.input,
            error && s.inputError,
            isSuccess && s.inputSuccess,
            quickFillWords && s.inputQuickFilling,
          )}
        />
        {quickFillWords && (
          <QuickFillOverlay
            words={quickFillWords}
            className={s.quickFillOverlay}
          />
        )}
        {statusRow}
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
