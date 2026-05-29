'use client';

import { type ChangeEvent, useState } from 'react';
import { z } from 'zod';
import { useValidation } from '@/features/useValidation/useValidation';
import {
  SCREEN_INDEX,
  useOnboardDataStore,
  useTrackContext,
} from '@/client_pages/onboard/model';
import { api } from '@/shared';

const HELPER_TEXT = 'Minimum 8 characters with letters and numbers';

const passwordSchema = z
  .string()
  .min(8, HELPER_TEXT)
  .regex(/(?=.*[a-zA-Z])(?=.*[0-9])/, HELPER_TEXT);

export const useCreatePassword = () => {
  const password = useOnboardDataStore(s => s.password);
  const authFlow = useOnboardDataStore(s => s.authFlow);
  const verificationToken = useOnboardDataStore(s => s.verificationToken);
  const setField = useOnboardDataStore(s => s.setField);
  const setLoading = useOnboardDataStore(s => s.setLoading);
  const { move } = useTrackContext();

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

    if (authFlow === 'reset') {
      setSubmitError(undefined);
      setLoading(true);

      try {
        await api.auth.setNewPassword(verificationToken ?? '', password);
        move.goForward(SCREEN_INDEX.PERSONAL_DATA);
      } catch {
        setSubmitError('Service temporarily unavailable');
      } finally {
        setLoading(false);
      }

      return;
    }

    move.goForward(SCREEN_INDEX.PERSONAL_DATA);
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
