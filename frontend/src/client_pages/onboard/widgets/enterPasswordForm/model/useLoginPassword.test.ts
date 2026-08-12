// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  login: vi.fn(),
  resetPassword: vi.fn(),
}));

const userApiMocks = vi.hoisted(() => {
  class AcceptInviteError extends Error {
    constructor(public body: Record<string, unknown>) {
      super('Failed to accept invite');
    }
  }

  return {
    acceptInvite: vi.fn(),
    AcceptInviteError,
  };
});

const modelMocks = vi.hoisted(() => ({
  next: vi.fn(),
  invite: null as { token: string } | null,
  nextPath: null as string | null,
}));

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('@/shared/client_api/auth', () => ({
  login: authMocks.login,
  resetPassword: authMocks.resetPassword,
}));

vi.mock('@/shared/client_api/user', () => ({
  acceptInvite: userApiMocks.acceptInvite,
  AcceptInviteError: userApiMocks.AcceptInviteError,
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
  };
});

import { SCREEN_ID, useOnboardDataStore } from '@/client_pages/onboard/model';
import type { Profile } from '@/shared/client_api/auth/types';
import { useLoadingStore } from '@/shared/store/useLoadingStore';
import { useUserStore } from '@/shared/store/useUserStore';
import { useLoginPassword } from './useLoginPassword';

const profile = {
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
  avatar: null,
  social_media_url: null,
  is_private: false,
  has_seen_feed_tour: false,
} satisfies Profile;

const changeEvent = (value: string) =>
  ({ target: { value } }) as ChangeEvent<HTMLInputElement>;

describe('useLoginPassword', () => {
  const setLoading = vi.fn();
  const setUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    modelMocks.invite = null;
    modelMocks.nextPath = null;
    authMocks.login.mockResolvedValue(profile);
    authMocks.resetPassword.mockResolvedValue(undefined);
    userApiMocks.acceptInvite.mockResolvedValue(undefined);
    useOnboardDataStore.getState().reset();
    useOnboardDataStore.setState({
      email: 'amy@example.com',
      password: 'Password1',
    });
    useLoadingStore.setState({ isLoading: false, setLoading });
    useUserStore.setState({ user: null, setUser });
  });

  afterEach(() => {
    cleanup();
  });

  it('logs in, stores the user, and restores the requested path', async () => {
    modelMocks.nextPath = '/user/amy?tab=wishes';
    const { result } = renderHook(() => useLoginPassword());

    await act(async () => result.current.submit.onSubmit());

    expect(authMocks.login).toHaveBeenCalledWith(
      'amy@example.com',
      'Password1',
    );
    expect(setUser).toHaveBeenCalledWith(profile);
    expect(routerMocks.push).toHaveBeenCalledWith('/user/amy?tab=wishes');
    expect(userApiMocks.acceptInvite).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('uses the home fallback when there is no return path', async () => {
    const { result } = renderHook(() => useLoginPassword());

    await act(async () => result.current.submit.onSubmit());

    expect(routerMocks.push).toHaveBeenCalledWith('/');
  });

  it('accepts an invite after login and advances to confirmation', async () => {
    modelMocks.invite = { token: 'invite-token' };
    const { result } = renderHook(() => useLoginPassword());

    await act(async () => result.current.submit.onSubmit());

    expect(userApiMocks.acceptInvite).toHaveBeenCalledWith('invite-token');
    expect(modelMocks.next).toHaveBeenCalledWith(SCREEN_ID.INVITE_REQUEST_SENT);
    expect(routerMocks.push).not.toHaveBeenCalled();
  });

  it('shows the invite-specific error and clears loading', async () => {
    modelMocks.invite = { token: 'used-token' };
    userApiMocks.acceptInvite.mockRejectedValueOnce(
      new userApiMocks.AcceptInviteError({ detail: 'used' }),
    );
    const { result } = renderHook(() => useLoginPassword());

    await act(async () => result.current.submit.onSubmit());

    expect(result.current.submit.error).toBe(
      'Unable to accept invite. Please try again.',
    );
    expect(modelMocks.next).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('shows a login error and clears it when the password changes', async () => {
    authMocks.login.mockRejectedValueOnce(new Error('invalid credentials'));
    const { result } = renderHook(() => useLoginPassword());

    await act(async () => result.current.submit.onSubmit());
    expect(result.current.submit.error).toBe('Login failed');
    expect(setLoading.mock.calls).toEqual([[true], [false]]);

    act(() => result.current.input.onChange(changeEvent('NewPassword2')));
    expect(result.current.input.value).toBe('NewPassword2');
    expect(result.current.submit.error).toBeUndefined();
  });

  it('starts password recovery, clears the password, and navigates', async () => {
    const { result } = renderHook(() => useLoginPassword());

    await act(async () => result.current.forgot.onForgot());

    expect(authMocks.resetPassword).toHaveBeenCalledWith('amy@example.com');
    expect(useOnboardDataStore.getState().password).toBe('');
    expect(modelMocks.next).toHaveBeenCalledWith(SCREEN_ID.VERIFY_RESET);
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('shows a recovery error and always restores loading', async () => {
    authMocks.resetPassword.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useLoginPassword());

    await act(async () => result.current.forgot.onForgot());

    expect(result.current.forgot.error).toBe('Service temporarily unavailable');
    expect(modelMocks.next).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });
});
