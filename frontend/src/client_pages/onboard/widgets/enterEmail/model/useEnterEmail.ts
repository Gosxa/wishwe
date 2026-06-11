'use client';

import { type ChangeEvent } from 'react';
import { z } from 'zod';
import { useValidation } from '@/features/useValidation/useValidation';
import {
  SCREEN_ID,
  useOnboardDataStore,
  useTrackContext,
} from '@/client_pages/onboard/model';
import { checkEmail } from '@/shared/client_api/auth';
import { useLoadingStore } from '@/shared/store/useLoadingStore';

const emailSchema = z.email('please, enter valid email');

export const useEnterEmail = () => {
  const email = useOnboardDataStore(s => s.email);
  const setLoading = useLoadingStore(s => s.setLoading);
  const setField = useOnboardDataStore(s => s.setField);

  const { next, back } = useTrackContext();
  const { error, isSuccess, check, set } = useValidation(emailSchema);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setField('email', e.target.value);
    set.error(undefined);
  };

  const onBlur = () => {
    if (email) check(email);
  };

  const onSubmit = async () => {
    if (!check(email)) return;

    setLoading(true);

    try {
      const { flow } = await checkEmail(email);

      next(flow === 'login' ? SCREEN_ID.ENTER_PWD : SCREEN_ID.VERIFY_REGISTER);
    } catch {
      set.error('Service temporarily unavailable');
    } finally {
      setLoading(false);
    }
  };

  return {
    input: {
      value: email,
      onChange,
      onBlur,
      error,
      helperText: isSuccess ? 'OK' : undefined,
      isSuccess,
    },
    submit: {
      onSubmit,
    },
    back: {
      onBack: () => back(SCREEN_ID.LOGIN_SCREEN),
    },
  };
};
