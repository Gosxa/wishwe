'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SCREEN_ID,
  useOnboardDataStore,
  useTrackContext,
  useInviteContext,
  handleGooglePostAuth,
} from '@/client_pages/onboard/model';
import { loginWithGoogle } from '@/shared/client_api/auth';
import { AcceptInviteError } from '@/shared/client_api/user';
import { useUserStore } from '@/shared/store/useUserStore';
import { useLoadingStore } from '@/shared/store/useLoadingStore';

const requestGoogleToken = (clientId: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const nonce = Math.random().toString(36).slice(2);
    const redirectUri = `${window.location.origin}/auth/google/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'id_token',
      scope: 'openid email profile',
      nonce,
      prompt: 'select_account',
    });

    const popup = window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      'google-oauth',
      'width=500,height=600,scrollbars=yes,resizable=yes',
    );

    if (!popup) {
      reject(new Error('Popup blocked'));

      return;
    }

    const ctx: {
      handler: (e: MessageEvent) => void;
      poll: ReturnType<typeof setInterval> | undefined;
    } = {
      handler: () => {},
      poll: undefined,
    };

    const cleanup = () => {
      clearInterval(ctx.poll);
      window.removeEventListener('message', ctx.handler);
    };

    ctx.handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'google-id-token') {
        cleanup();
        resolve(event.data.token as string);
      } else if (event.data?.type === 'google-error') {
        cleanup();
        reject(new Error(event.data.error as string));
      }
    };

    ctx.poll = setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error('Cancelled'));
      }
    }, 500);

    window.addEventListener('message', ctx.handler);
  });

export const useLoginScreen = () => {
  const setLoading = useLoadingStore(s => s.setLoading);
  const setField = useOnboardDataStore(s => s.setField);
  const setAvatarUrl = useOnboardDataStore(s => s.setAvatarUrl);
  const { next } = useTrackContext();
  const invite = useInviteContext();
  const router = useRouter();
  const setUser = useUserStore(s => s.setUser);
  const [googleError, setGoogleError] = useState('');

  const onGoogle = async () => {
    setLoading(true);
    setGoogleError('');

    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ?? '';
      const idToken = await requestGoogleToken(clientId);
      const user = await loginWithGoogle(idToken);

      setUser(user);

      await handleGooglePostAuth({
        user,
        invite,
        next,
        navigateHome: () => router.push('/'),
        prefillGoogleProfile: profileUser => {
          setField('firstName', profileUser.first_name ?? '');
          setField('lastName', profileUser.last_name ?? '');
          setAvatarUrl(profileUser.avatar ?? null);
        },
      });
    } catch (e) {
      const err = e as Error;

      if (err.message === 'Cancelled') return;

      if (err instanceof AcceptInviteError) {
        setGoogleError('Unable to accept invite. Please try again.');
      } else {
        setGoogleError('Service temporarily unavailable');
      }
    } finally {
      setLoading(false);
    }
  };

  const onEmail = () => {
    next(SCREEN_ID.ENTER_EMAIL);
  };

  return { onGoogle, onEmail, googleError };
};
