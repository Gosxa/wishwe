'use client';

import { useState } from 'react';
import {
  SCREEN_INDEX,
  useOnboardDataStore,
  useTrackContext,
} from '@/client_pages/onboard/model';
import { api } from '@/shared';
import { useCodeInput } from './useCodeInput';

export const useVerifyEmail = () => {
  const email = useOnboardDataStore(s => s.email);
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
      move.goForward(SCREEN_INDEX.PASSWORD_FORM);
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setLoading(false);
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
    back: {
      onBack: () => move.goBack(SCREEN_INDEX.VERIFY_EMAIL),
    },
    email,
  };
};
