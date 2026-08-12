// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  setNewPassword: vi.fn(),
  login: vi.fn(),
}));

const trackMocks = vi.hoisted(() => ({
  next: vi.fn(),
}));

vi.mock('@/shared/client_api/auth', () => ({
  setNewPassword: authMocks.setNewPassword,
  login: authMocks.login,
}));

vi.mock('@/client_pages/onboard/model', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/client_pages/onboard/model')>();

  return {
    ...actual,
    useTrackContext: () => ({ next: trackMocks.next }),
  };
});

import { SCREEN_ID, useOnboardDataStore } from '@/client_pages/onboard/model';
import { PASSWORD_HELPER_TEXT } from '@/shared/lib/validation/password';
import { useLoadingStore } from '@/shared/store/useLoadingStore';
import { useCreatePassword } from './useCreatePassword';

const changeEvent = (value: string) =>
  ({ target: { value } }) as ChangeEvent<HTMLInputElement>;

describe('useCreatePassword', () => {
  const setLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.setNewPassword.mockResolvedValue(undefined);
    authMocks.login.mockResolvedValue({});
    useOnboardDataStore.getState().reset();
    useOnboardDataStore.setState({
      email: 'amy@example.com',
      verificationToken: 'reset-token',
    });
    useLoadingStore.setState({ isLoading: false, setLoading });
  });

  afterEach(() => {
    cleanup();
  });

  it('validates password strength on blur and clears the error while typing', () => {
    const { result } = renderHook(() => useCreatePassword('register'));

    act(() => result.current.passwordInput.onChange(changeEvent('short')));
    act(() => result.current.passwordInput.onBlur());

    expect(result.current.passwordInput.error).toBe(PASSWORD_HELPER_TEXT);
    expect(result.current.passwordInput.isSuccess).toBe(false);

    act(() => result.current.passwordInput.onChange(changeEvent('Password1')));
    expect(result.current.passwordInput.error).toBeUndefined();

    act(() => result.current.passwordInput.onBlur());
    expect(result.current.passwordInput.isSuccess).toBe(true);
  });

  it('does not advance until a registration password is valid', async () => {
    const { result } = renderHook(() => useCreatePassword('register'));

    act(() => result.current.passwordInput.onChange(changeEvent('weak')));
    act(() => result.current.passwordInput.onBlur());
    await act(async () => result.current.submit.onSubmit());

    expect(trackMocks.next).not.toHaveBeenCalled();
    expect(authMocks.setNewPassword).not.toHaveBeenCalled();
  });

  it('advances a valid registration without calling reset APIs', async () => {
    const { result } = renderHook(() => useCreatePassword('register'));

    act(() => result.current.passwordInput.onChange(changeEvent('Password1')));
    act(() => result.current.passwordInput.onBlur());
    await act(async () => result.current.submit.onSubmit());

    expect(trackMocks.next).toHaveBeenCalledWith(SCREEN_ID.PERSONAL_MAIL);
    expect(authMocks.setNewPassword).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
  });

  it('reports mismatched reset confirmation and clears it on change', () => {
    const { result } = renderHook(() => useCreatePassword('reset'));

    act(() => result.current.passwordInput.onChange(changeEvent('Password1')));
    act(() => result.current.passwordInput.onBlur());
    act(() => result.current.confirmInput.onChange(changeEvent('Password2')));
    act(() => result.current.confirmInput.onBlur());

    expect(result.current.confirmInput.error).toBe("Passwords don't match");

    act(() => result.current.confirmInput.onChange(changeEvent('Password1')));
    expect(result.current.confirmInput.error).toBeUndefined();
  });

  it('sets a new password, logs in, and advances after a valid reset', async () => {
    const { result } = renderHook(() => useCreatePassword('reset'));

    act(() => result.current.passwordInput.onChange(changeEvent('Password1')));
    act(() => result.current.passwordInput.onBlur());
    act(() => result.current.confirmInput.onChange(changeEvent('Password1')));
    await act(async () => result.current.submit.onSubmit());

    expect(authMocks.setNewPassword).toHaveBeenCalledWith(
      'reset-token',
      'Password1',
    );
    expect(authMocks.login).toHaveBeenCalledWith(
      'amy@example.com',
      'Password1',
    );
    expect(authMocks.setNewPassword.mock.invocationCallOrder[0]).toBeLessThan(
      authMocks.login.mock.invocationCallOrder[0],
    );
    expect(trackMocks.next).toHaveBeenCalledWith(SCREEN_ID.DONE_RESET);
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('uses an empty reset token when none is stored', async () => {
    useOnboardDataStore.setState({ verificationToken: null });
    const { result } = renderHook(() => useCreatePassword('reset'));

    act(() => result.current.passwordInput.onChange(changeEvent('Password1')));
    act(() => result.current.passwordInput.onBlur());
    act(() => result.current.confirmInput.onChange(changeEvent('Password1')));
    await act(async () => result.current.submit.onSubmit());

    expect(authMocks.setNewPassword).toHaveBeenCalledWith('', 'Password1');
  });

  it('shows a reset error and always restores loading', async () => {
    authMocks.setNewPassword.mockRejectedValueOnce(new Error('expired token'));
    const { result } = renderHook(() => useCreatePassword('reset'));

    act(() => result.current.passwordInput.onChange(changeEvent('Password1')));
    act(() => result.current.passwordInput.onBlur());
    act(() => result.current.confirmInput.onChange(changeEvent('Password1')));
    await act(async () => result.current.submit.onSubmit());

    expect(result.current.submit.error).toBe('Service temporarily unavailable');
    expect(authMocks.login).not.toHaveBeenCalled();
    expect(trackMocks.next).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });
});
