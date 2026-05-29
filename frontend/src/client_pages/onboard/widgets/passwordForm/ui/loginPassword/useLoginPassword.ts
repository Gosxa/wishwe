'use client';

import { type ChangeEvent, useState } from 'react';
import {
  SCREEN_INDEX,
  useOnboardDataStore,
  useTrackContext,
} from '@/client_pages/onboard/model';
import { api } from '@/shared';

export const useLoginPassword = () => {
  const email = useOnboardDataStore(s => s.email);
  const password = useOnboardDataStore(s => s.password);
  const setField = useOnboardDataStore(s => s.setField);
  const setLoading = useOnboardDataStore(s => s.setLoading);
  const setAuthFlow = useOnboardDataStore(s => s.setAuthFlow);
  const { move } = useTrackContext();

  const [error, setError] = useState<string | undefined>();
  const [forgotError, setForgotError] = useState<string | undefined>();

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setField('password', e.target.value);
    setError(undefined);
  };

  const onSubmit = async () => {
    setError(undefined);
    setLoading(true);

    try {
      await api.auth.getTokens(email, password);
    } catch {
      setError('Login failed');
      setLoading(false);

      return;
    }

    try {
      const profile = await api.user.me();

      // eslint-disable-next-line no-console
      console.log(profile);
    } catch {
      setError('Service temporarily unavailable');
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async () => {
    setForgotError(undefined);
    setLoading(true);

    try {
      await api.auth.resetPwd(email);

      setField('password', '');
      setAuthFlow('reset');
      move.revealScreen(SCREEN_INDEX.VERIFY_EMAIL, SCREEN_INDEX.PASSWORD_FORM);
    } catch {
      setForgotError('Service temporarily unavailable');
    } finally {
      setLoading(false);
    }
  };

  return {
    input: { value: password, onChange },
    submit: { onSubmit, error },
    forgot: { onForgot, error: forgotError },
  };
};
