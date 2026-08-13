// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  loginWithGoogle: vi.fn(),
}));

const modelMocks = vi.hoisted(() => ({
  next: vi.fn(),
  invite: null as { token: string } | null,
  nextPath: null as string | null,
  handleGooglePostAuth: vi.fn(),
}));

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('@/shared/client_api/auth', () => ({
  loginWithGoogle: authMocks.loginWithGoogle,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerMocks.push }),
}));

vi.mock('@/client_pages/onboard/model', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/client_pages/onboard/model')>();

  return {
    ...actual,
    useTrackContext: () => ({ next: modelMocks.next }),
    useInviteContext: () => modelMocks.invite,
    useNextPath: () => modelMocks.nextPath,
    handleGooglePostAuth: modelMocks.handleGooglePostAuth,
  };
});

import { SCREEN_ID, useOnboardDataStore } from '@/client_pages/onboard/model';
import type { Profile } from '@/shared/client_api/auth/types';
import { AcceptInviteError } from '@/shared/client_api/user';
import { useLoadingStore } from '@/shared/store/useLoadingStore';
import { useUserStore } from '@/shared/store/useUserStore';
import { useLoginScreen } from './useLoginScreen';

const profile: Profile = {
  id: 7,
  user: 'amy@example.com',
  user_id: 7,
  username: 'amy',
  first_name: 'Amy',
  last_name: 'Lee',
  bio: null,
  date_of_birth: null,
  city: null,
  gender: null,
  avatar: 'https://cdn.example/amy.png',
  social_media_url: null,
  is_private: false,
  has_seen_feed_tour: false,
};

describe('useLoginScreen', () => {
  const setLoading = vi.fn();
  const setUser = vi.fn();
  const setField = vi.fn();
  const setAvatarUrl = vi.fn();
  let popup: { closed: boolean };
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    modelMocks.invite = null;
    modelMocks.nextPath = null;
    authMocks.loginWithGoogle.mockResolvedValue(profile);
    modelMocks.handleGooglePostAuth.mockResolvedValue(undefined);
    useLoadingStore.setState({ isLoading: false, setLoading });
    useUserStore.setState({ user: null, setUser });
    useOnboardDataStore.getState().reset();
    useOnboardDataStore.setState({ setField, setAvatarUrl });
    popup = { closed: false };
    openSpy = vi
      .spyOn(window, 'open')
      .mockReturnValue(popup as unknown as Window);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const startGoogle = (result: {
    current: ReturnType<typeof useLoginScreen>;
  }) => {
    let promise!: Promise<void>;

    act(() => {
      promise = result.current.onGoogle();
    });

    return promise;
  };

  const sendGoogleMessage = (
    data: Record<string, unknown>,
    origin = window.location.origin,
  ) => {
    window.dispatchEvent(new MessageEvent('message', { data, origin }));
  };

  it('advances to email authentication', () => {
    const { result } = renderHook(() => useLoginScreen());

    act(() => result.current.onEmail());

    expect(modelMocks.next).toHaveBeenCalledWith(SCREEN_ID.ENTER_EMAIL);
  });

  it('opens Google OAuth, accepts only same-origin success, and delegates post-auth', async () => {
    modelMocks.invite = { token: 'invite-token' };
    modelMocks.nextPath = '/user/amy?tab=plans';
    const { result } = renderHook(() => useLoginScreen());
    const promise = startGoogle(result);

    sendGoogleMessage(
      { type: 'google-id-token', token: 'evil-token' },
      'https://evil.example',
    );
    expect(authMocks.loginWithGoogle).not.toHaveBeenCalled();

    await act(async () => {
      sendGoogleMessage({ type: 'google-id-token', token: 'google-token' });
      await promise;
    });

    const [authUrl, popupName, popupFeatures] = openSpy.mock.calls[0];
    const parsedAuthUrl = new URL(authUrl as string);

    expect(parsedAuthUrl.origin).toBe('https://accounts.google.com');
    expect(parsedAuthUrl.pathname).toBe('/o/oauth2/v2/auth');
    expect(parsedAuthUrl.searchParams.get('client_id')).toBe(
      '904699722219-hsmhbcc5gd17lu710mff0m26bvauiur3.apps.googleusercontent.com',
    );
    expect(parsedAuthUrl.searchParams.get('redirect_uri')).toBe(
      `${window.location.origin}/auth/google/callback`,
    );
    expect(parsedAuthUrl.searchParams.get('response_type')).toBe('id_token');
    expect(parsedAuthUrl.searchParams.get('scope')).toBe(
      'openid email profile',
    );
    expect(parsedAuthUrl.searchParams.get('nonce')).toBeTruthy();
    expect(popupName).toBe('google-oauth');
    expect(popupFeatures).toBe(
      'width=500,height=600,scrollbars=yes,resizable=yes',
    );
    expect(authMocks.loginWithGoogle).toHaveBeenCalledWith('google-token');
    expect(setUser).toHaveBeenCalledWith(profile);
    expect(modelMocks.handleGooglePostAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        user: profile,
        invite: { token: 'invite-token' },
        next: modelMocks.next,
      }),
    );
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
    expect(vi.getTimerCount()).toBe(0);

    const postAuth = modelMocks.handleGooglePostAuth.mock.calls[0][0];

    postAuth.navigateHome();
    expect(routerMocks.push).toHaveBeenCalledWith('/user/amy?tab=plans');

    postAuth.prefillGoogleProfile({
      ...profile,
      first_name: null,
      last_name: null,
      avatar: null,
    });
    expect(setField.mock.calls).toEqual([
      ['firstName', ''],
      ['lastName', ''],
    ]);
    expect(setAvatarUrl).toHaveBeenCalledWith(null);
  });

  it('uses the home fallback in the post-auth navigation callback', async () => {
    const { result } = renderHook(() => useLoginScreen());
    const promise = startGoogle(result);

    await act(async () => {
      sendGoogleMessage({ type: 'google-id-token', token: 'google-token' });
      await promise;
    });

    modelMocks.handleGooglePostAuth.mock.calls[0][0].navigateHome();
    expect(routerMocks.push).toHaveBeenCalledWith('/');
  });

  it('shows a service error when the popup is blocked', async () => {
    openSpy.mockReturnValueOnce(null);
    const { result } = renderHook(() => useLoginScreen());

    await act(async () => result.current.onGoogle());

    expect(result.current.googleError).toBe('Service temporarily unavailable');
    expect(authMocks.loginWithGoogle).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('silently handles popup cancellation and cleans up polling', async () => {
    const { result } = renderHook(() => useLoginScreen());
    const promise = startGoogle(result);

    popup.closed = true;

    await act(async () => {
      vi.advanceTimersByTime(500);
      await promise;
    });

    expect(result.current.googleError).toBe('');
    expect(authMocks.loginWithGoogle).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('shows a service error returned by the OAuth callback', async () => {
    const { result } = renderHook(() => useLoginScreen());
    const promise = startGoogle(result);

    await act(async () => {
      sendGoogleMessage({ type: 'google-error', error: 'access_denied' });
      await promise;
    });

    expect(result.current.googleError).toBe('Service temporarily unavailable');
    expect(authMocks.loginWithGoogle).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('shows a service error when token exchange fails', async () => {
    authMocks.loginWithGoogle.mockRejectedValueOnce(new Error('bad token'));
    const { result } = renderHook(() => useLoginScreen());
    const promise = startGoogle(result);

    await act(async () => {
      sendGoogleMessage({ type: 'google-id-token', token: 'google-token' });
      await promise;
    });

    expect(result.current.googleError).toBe('Service temporarily unavailable');
    expect(setUser).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('shows the invite-specific error from post-auth processing', async () => {
    modelMocks.handleGooglePostAuth.mockRejectedValueOnce(
      new AcceptInviteError({ detail: 'used' }),
    );
    const { result } = renderHook(() => useLoginScreen());
    const promise = startGoogle(result);

    await act(async () => {
      sendGoogleMessage({ type: 'google-id-token', token: 'google-token' });
      await promise;
    });

    expect(result.current.googleError).toBe(
      'Unable to accept invite. Please try again.',
    );
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });
});
