'use client';

import { useState } from 'react';
import {
  SCREEN_ID,
  useOnboardDataStore,
  useTrackContext,
  type VerifyEmailVariant,
} from '@/client_pages/onboard/model';
import { useLoadingStore } from '@/shared/store/useLoadingStore';
import {
  checkEmail,
  verifyCode,
  resetPassword,
} from '@/shared/client_api/auth';
import { useCodeInput } from './useCodeInput';
import { useResendTimer } from './useResendTimer';

export const useVerifyEmail = (variant: VerifyEmailVariant) => {
  const email = useOnboardDataStore(s => s.email);
  const setLoading = useLoadingStore(s => s.setLoading);
  const setVerificationToken = useOnboardDataStore(s => s.setVerificationToken);
  const setField = useOnboardDataStore(s => s.setField);
  const { next, back } = useTrackContext();

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
      const { verification_token } = await verifyCode(email, code);

      setVerificationToken(verification_token);
      resetTimer();
      next(variant === 'reset' ? SCREEN_ID.RESET_PWD : SCREEN_ID.CREATE_PWD);
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
      if (variant === 'reset') {
        await resetPassword(email);
      } else {
        await checkEmail(email);
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

    if (variant === 'reset') {
      back(SCREEN_ID.LOGIN_SCREEN);
    } else {
      setField('email', '');
      back(SCREEN_ID.ENTER_EMAIL);
    }
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
      label: variant === 'reset' ? 'Go back' : 'Change email',
    },
    email,
  };
};
