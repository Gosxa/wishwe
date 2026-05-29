'use client';

import { useState } from 'react';
import { useOnboardDataStore, useTrackContext } from '@/client_pages/onboard/model';

export const useLoginScreen = () => {
  const setLoading = useOnboardDataStore(s => s.setLoading);
  const setAuthMethod = useOnboardDataStore(s => s.setAuthMethod);
  const { move } = useTrackContext();
  const [googleError, setGoogleError] = useState('');

  const onGoogle = async () => {
    setLoading(true);
    setGoogleError('');
    setAuthMethod('google');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch {
      setGoogleError('Unable to connect with google servers');
    } finally {
      setLoading(false);
    }
  };

  const onEmail = () => {
    setAuthMethod('email');
    move.goForward(1);
  };

  return { onGoogle, onEmail, googleError };
};
