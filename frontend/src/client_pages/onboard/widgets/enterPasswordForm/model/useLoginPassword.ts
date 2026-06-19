'use client';

import { type ChangeEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SCREEN_ID,
  useOnboardDataStore,
  useTrackContext,
  useInviteContext,
} from '@/client_pages/onboard/model';
import { login, resetPassword } from '@/shared/client_api/auth';
import { acceptInvite, AcceptInviteError } from '@/shared/client_api/user';
import { useUserStore } from '@/shared/store/useUserStore';
import { useLoadingStore } from '@/shared/store/useLoadingStore';

export const useLoginPassword = () => {
  const email = useOnboardDataStore(s => s.email);
  const password = useOnboardDataStore(s => s.password);
  const setField = useOnboardDataStore(s => s.setField);
  const setLoading = useLoadingStore(s => s.setLoading);
  const { next } = useTrackContext();
  const invite = useInviteContext();
  const router = useRouter();

  const setUser = useUserStore(s => s.setUser);
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
      const user = await login(email, password);

      setUser(user);

      if (invite) {
        await acceptInvite(invite.token);
        next(SCREEN_ID.INVITE_REQUEST_SENT);
      } else {
        router.push('/');
      }
    } catch (e) {
      if (e instanceof AcceptInviteError) {
        setError('Unable to accept invite. Please try again.');
      } else {
        setError('Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async () => {
    setForgotError(undefined);
    setLoading(true);

    try {
      await resetPassword(email);
      setField('password', '');
      next(SCREEN_ID.VERIFY_RESET);
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
