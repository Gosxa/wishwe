'use client';

import { type ChangeEvent } from 'react';
import { z } from 'zod';
import { useValidation } from '@/features/useValidation/useValidation';
import {
  SCREEN_INDEX,
  useOnboardDataStore,
  useTrackContext,
} from '@/client_pages/onboard/model';

const HELPER_TEXT = 'Minimum 8 characters with letters and numbers';

const passwordSchema = z
  .string()
  .min(8, 'Password must have at least 8 symbols')
  .regex(
    /(?=.*[a-zA-Z])(?=.*[0-9])/,
    'Password must have at least 1 letter and 1 number',
  );

export const usePasswordForm = () => {
  const password = useOnboardDataStore(s => s.password);
  const authFlow = useOnboardDataStore(s => s.authFlow);
  const setField = useOnboardDataStore(s => s.setField);
  const setLoading = useOnboardDataStore(s => s.setLoading);
  const { move } = useTrackContext();
  const { error, isSuccess, check, set } = useValidation(passwordSchema);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setField('password', e.target.value);
    set.error(undefined);
  };

  const onBlur = () => {
    if (password) check(password);
  };

  const onSubmit = async () => {
    if (!check(password)) return;
    setLoading(true);
    setLoading(false);
  };

  const backIndex =
    authFlow === 'login' || authFlow === 'reset'
      ? SCREEN_INDEX.ENTER_EMAIL
      : SCREEN_INDEX.VERIFY_EMAIL;

  return {
    input: {
      value: password,
      onChange,
      onBlur,
      error,
      helperText: HELPER_TEXT,
      isSuccess,
    },
    submit: {
      onSubmit,
    },
    back: {
      onBack: () => move.goBack(backIndex),
    },
  };
};
