'use client';

import { type ChangeEvent } from 'react';
import { z } from 'zod';
import { useValidation } from '@/features/useValidation/useValidation';
import { useOnboardDataStore } from '@/client_pages/onboard/model';
import { api } from '@/shared';

const emailSchema = z.email('please, enter valid email');

export const useEnterEmail = () => {
  const email = useOnboardDataStore(s => s.email);
  const setLoading = useOnboardDataStore(s => s.setLoading);
  const setField = useOnboardDataStore(s => s.setField);
  const { error, isSuccess, check, set } = useValidation(emailSchema);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setField('email', e.target.value);
  };

  const onBlur = () => {
    if (email) {
      check(email);
    }
  };

  const onSubmit = async () => {
    if (!check(email)) {
      return;
    }

    setLoading(true);

    try {
      const flow = await api.auth.sendCode(email);

      // eslint-disable-next-line no-console
      console.log(flow);
    } catch {
      set.error('Service temporaly unavailable');
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    onChange,
    onBlur,
    onSubmit,
    error,
    helperText: isSuccess ? 'OK' : undefined,
    isSuccess,
  };
};
