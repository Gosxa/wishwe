'use client';

import {
  useState,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type ClipboardEvent,
} from 'react';

const CODE_LENGTH = 6;

export const useCodeInput = () => {
  const [values, setValues] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focus = (index: number) => inputRefs.current[index]?.focus();

  const onChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1);

    setValues(prev => {
      const next = [...prev];

      next[index] = digit;

      return next;
    });

    if (digit && index < CODE_LENGTH - 1) focus(index + 1);
  };

  const onKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Backspace') return;

    if (values[index]) {
      setValues(prev => {
        const next = [...prev];

        next[index] = '';

        return next;
      });
    } else if (index > 0) {
      setValues(prev => {
        const next = [...prev];

        next[index - 1] = '';

        return next;
      });
      focus(index - 1);
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, CODE_LENGTH);

    setValues(prev => {
      const next = [...prev];

      digits.split('').forEach((d, i) => {
        next[i] = d;
      });

      return next;
    });

    focus(Math.min(digits.length, CODE_LENGTH - 1));
  };

  const code = values.join('');

  return {
    values,
    inputRefs,
    onChange,
    onKeyDown,
    onPaste,
    code,
    isComplete: code.length === CODE_LENGTH,
  };
};
