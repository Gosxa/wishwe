'use client';

import { type ChangeEvent } from 'react';
import { z } from 'zod';
import { useValidation } from '@/features/useValidation/useValidation';
import {
  SCREEN_INDEX,
  useOnboardDataStore,
  useTrackContext,
} from '@/client_pages/onboard/model';
import { api } from '@/shared';

const emailSchema = z.email('please, enter valid email');

export const useEnterEmail = () => {
  const email = useOnboardDataStore(s => s.email);
  const setLoading = useOnboardDataStore(s => s.setLoading);
  const setField = useOnboardDataStore(s => s.setField);
  const setAuthFlow = useOnboardDataStore(s => s.setAuthFlow);
  const { move } = useTrackContext();
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
      const { flow } = await api.auth.sendCode(email);

      setAuthFlow(flow);
      move.goForward(
        flow === 'login'
          ? SCREEN_INDEX.PASSWORD_FORM
          : SCREEN_INDEX.VERIFY_EMAIL,
      );
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
      onBack: () => move.goBack(SCREEN_INDEX.ENTER_EMAIL),
    },
  };
};
