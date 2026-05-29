'use client';

import { useState } from 'react';
import {
  SCREEN_INDEX,
  useOnboardDataStore,
  useTrackContext,
} from '@/client_pages/onboard/model';
import { api } from '@/shared';
import { useCodeInput } from './useCodeInput';
import { useResendTimer } from './useResendTimer';

export const useVerifyEmail = () => {
  const email = useOnboardDataStore(s => s.email);
  const authFlow = useOnboardDataStore(s => s.authFlow);
  const setLoading = useOnboardDataStore(s => s.setLoading);
  const setVerificationToken = useOnboardDataStore(s => s.setVerificationToken);
  const { move } = useTrackContext();

  const {
    values,
    inputRefs,
    onChange: onCellChange,
    onKeyDown,
    onPaste,
    isComplete,
    code,
  } = useCodeInput();
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [resendError, setResendError] = useState<string | undefined>();

  const { seconds, start: startTimer, reset: resetTimer } = useResendTimer();

  const onChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    onCellChange(i, e);
    setSubmitError(undefined);
  };

  const onSubmit = async () => {
    if (!isComplete) return;

    setSubmitError(undefined);
    setLoading(true);

    try {
      const { verification_token } = await api.auth.verifyCode(email, code);

      setVerificationToken(verification_token);
      resetTimer();
      move.goForward(SCREEN_INDEX.PASSWORD_FORM);
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setResendError(undefined);
    setLoading(true);

    try {
      if (authFlow === 'reset') {
        await api.auth.resetPwd(email);
      } else {
        await api.auth.sendCode(email);
      }

      startTimer();
    } catch {
      setResendError('Service temporarily unavailable');
    } finally {
      setLoading(false);
    }
  };

  const onBack = () => {
    resetTimer();
    move.goBack(SCREEN_INDEX.VERIFY_EMAIL);
  };

  return {
    cells: {
      values,
      inputRefs,
      onChange,
      onKeyDown,
      onPaste,
      hasError: !!submitError,
    },
    submit: {
      onSubmit,
      error: submitError,
    },
    resend: {
      seconds,
      onResend,
      error: resendError,
    },
    back: {
      onBack,
    },
    email,
  };
};
