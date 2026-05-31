'use client';

import { useState } from 'react';
import {
  SCREEN_ID,
  useOnboardDataStore,
  useTrackContext,
} from '@/client_pages/onboard/model';

export const useLoginScreen = () => {
  const setLoading = useOnboardDataStore(s => s.setLoading);
  const { next } = useTrackContext();
  const [googleError, setGoogleError] = useState('');

  const onGoogle = async () => {
    setLoading(true);
    setGoogleError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      next(SCREEN_ID.PERSONAL_GOOGLE);
    } catch {
      setGoogleError('Unable to connect with google servers');
    } finally {
      setLoading(false);
    }
  };

  const onEmail = () => {
    next(SCREEN_ID.ENTER_EMAIL);
  };

  return { onGoogle, onEmail, googleError };
};
