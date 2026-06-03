'use client';

import { type ChangeEvent, useState } from 'react';
import { z } from 'zod';
import { useValidation } from '@/features/useValidation/useValidation';
import {
  SCREEN_ID,
  useOnboardDataStore,
  useTrackContext,
  type CreatePasswordVariant,
} from '@/client_pages/onboard/model';
import { setNewPassword, login } from '@/shared/client_api/auth';
import { useLoadingStore } from '@/shared/store/useLoadingStore';

const HELPER_TEXT = 'Minimum 8 characters with letters and numbers';

const passwordSchema = z
  .string()
  .min(8, HELPER_TEXT)
  .regex(/(?=.*[a-zA-Z])(?=.*[0-9])/, HELPER_TEXT);

export const useCreatePassword = (variant: CreatePasswordVariant) => {
  const email = useOnboardDataStore(s => s.email);
  const password = useOnboardDataStore(s => s.password);
  const verificationToken = useOnboardDataStore(s => s.verificationToken);
  const setField = useOnboardDataStore(s => s.setField);
  const setLoading = useLoadingStore(s => s.setLoading);
  const { next } = useTrackContext();

  const [confirm, setConfirm] = useState('');
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | undefined>();

  const { error, isSuccess, check, set } = useValidation(passwordSchema);

  const onPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setField('password', e.target.value);
    set.error(undefined);
  };

  const onPasswordBlur = () => {
    if (password) check(password);
  };

  const onConfirmChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfirm(e.target.value);
    if (confirmError) setConfirmError(undefined);
  };

  const onConfirmBlur = () => {
    if (confirm && confirm !== password) {
      setConfirmError("Passwords don't match");
    }
  };

  const isValid = isSuccess && confirm === password && confirm.length > 0;

  const onSubmit = async () => {
    if (!isValid) return;

    if (variant === 'reset') {
      setSubmitError(undefined);
      setLoading(true);

      try {
        await setNewPassword(verificationToken ?? '', password);
        await login(email, password);
        next(SCREEN_ID.DONE_RESET);
      } catch {
        setSubmitError('Service temporarily unavailable');
      } finally {
        setLoading(false);
      }

      return;
    }

    next(SCREEN_ID.PERSONAL_MAIL);
  };

  return {
    passwordInput: {
      value: password,
      onChange: onPasswordChange,
      onBlur: onPasswordBlur,
      error,
      helperText: HELPER_TEXT,
      isSuccess,
    },
    confirmInput: {
      value: confirm,
      onChange: onConfirmChange,
      onBlur: onConfirmBlur,
      error: confirmError,
    },
    submit: {
      onSubmit,
      error: submitError,
    },
  };
};
