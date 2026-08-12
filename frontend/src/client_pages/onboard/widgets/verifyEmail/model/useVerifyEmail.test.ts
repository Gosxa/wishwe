// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  checkEmail: vi.fn(),
  verifyCode: vi.fn(),
  resetPassword: vi.fn(),
}));

const trackMocks = vi.hoisted(() => ({
  next: vi.fn(),
  back: vi.fn(),
}));

const codeMocks = vi.hoisted(() => ({
  values: ['1', '2', '3', '4', '5', '6'],
  inputRefs: { current: [] },
  onChange: vi.fn(),
  onKeyDown: vi.fn(),
  onPaste: vi.fn(),
  isComplete: true,
  code: '123456',
}));

const timerMocks = vi.hoisted(() => ({
  seconds: 0,
  start: vi.fn(),
  reset: vi.fn(),
}));

vi.mock('@/shared/client_api/auth', () => ({
  checkEmail: authMocks.checkEmail,
  verifyCode: authMocks.verifyCode,
  resetPassword: authMocks.resetPassword,
}));

vi.mock('./useCodeInput', () => ({
  useCodeInput: () => codeMocks,
}));

vi.mock('./useResendTimer', () => ({
  useResendTimer: () => timerMocks,
}));

vi.mock('@/client_pages/onboard/model', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/client_pages/onboard/model')>();

  return {
    ...actual,
    useTrackContext: () => ({
      next: trackMocks.next,
      back: trackMocks.back,
    }),
  };
});

import { SCREEN_ID, useOnboardDataStore } from '@/client_pages/onboard/model';
import { useLoadingStore } from '@/shared/store/useLoadingStore';
import { useVerifyEmail } from './useVerifyEmail';

const inputEvent = {
  target: { value: '1' },
} as ChangeEvent<HTMLInputElement>;

describe('useVerifyEmail', () => {
  const setLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    codeMocks.isComplete = true;
    codeMocks.code = '123456';
    timerMocks.seconds = 0;
    authMocks.verifyCode.mockResolvedValue({
      verification_token: 'verified-token',
    });
    authMocks.checkEmail.mockResolvedValue({ flow: 'register' });
    authMocks.resetPassword.mockResolvedValue(undefined);
    useOnboardDataStore.getState().reset();
    useOnboardDataStore.setState({ email: 'amy@example.com' });
    useLoadingStore.setState({ isLoading: false, setLoading });
  });

  afterEach(() => {
    cleanup();
  });

  it('does not submit an incomplete code', async () => {
    codeMocks.isComplete = false;
    codeMocks.code = '123';
    const { result } = renderHook(() => useVerifyEmail('register'));

    await act(async () => result.current.submit.onSubmit());

    expect(authMocks.verifyCode).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
  });

  it.each([
    ['register', SCREEN_ID.CREATE_PWD],
    ['reset', SCREEN_ID.RESET_PWD],
  ] as const)(
    'verifies the %s code, stores its token, and advances',
    async (variant, screen) => {
      const { result } = renderHook(() => useVerifyEmail(variant));

      await act(async () => result.current.submit.onSubmit());

      expect(authMocks.verifyCode).toHaveBeenCalledWith(
        'amy@example.com',
        '123456',
      );
      expect(useOnboardDataStore.getState().verificationToken).toBe(
        'verified-token',
      );
      expect(timerMocks.reset).toHaveBeenCalledOnce();
      expect(trackMocks.next).toHaveBeenCalledWith(screen);
      expect(setLoading.mock.calls).toEqual([[true], [false]]);
    },
  );

  it('shows the verification error, flags cells, and clears it on change', async () => {
    authMocks.verifyCode.mockRejectedValueOnce(new Error('Invalid code'));
    const { result } = renderHook(() => useVerifyEmail('register'));

    await act(async () => result.current.submit.onSubmit());

    expect(result.current.submit.error).toBe('Invalid code');
    expect(result.current.cells.hasError).toBe(true);
    expect(setLoading.mock.calls).toEqual([[true], [false]]);

    act(() => result.current.cells.onChange(0, inputEvent));
    expect(codeMocks.onChange).toHaveBeenCalledWith(0, inputEvent);
    expect(result.current.submit.error).toBeUndefined();
  });

  it.each([
    ['register', 'checkEmail'],
    ['reset', 'resetPassword'],
  ] as const)(
    'resends the %s code and restarts the timer',
    async (variant, expectedApi) => {
      const { result } = renderHook(() => useVerifyEmail(variant));

      await act(async () => result.current.resend.onResend());

      if (expectedApi === 'checkEmail') {
        expect(authMocks.checkEmail).toHaveBeenCalledWith('amy@example.com');
        expect(authMocks.resetPassword).not.toHaveBeenCalled();
      } else {
        expect(authMocks.resetPassword).toHaveBeenCalledWith('amy@example.com');
        expect(authMocks.checkEmail).not.toHaveBeenCalled();
      }

      expect(timerMocks.start).toHaveBeenCalledOnce();
      expect(setLoading.mock.calls).toEqual([[true], [false]]);
    },
  );

  it('shows a resend error without restarting the timer', async () => {
    authMocks.checkEmail.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useVerifyEmail('register'));

    await act(async () => result.current.resend.onResend());

    expect(result.current.resend.error).toBe('Service temporarily unavailable');
    expect(timerMocks.start).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('returns registration to email entry and clears the stored email', () => {
    const { result } = renderHook(() => useVerifyEmail('register'));

    act(() => result.current.back.onBack());

    expect(timerMocks.reset).toHaveBeenCalledOnce();
    expect(useOnboardDataStore.getState().email).toBe('');
    expect(trackMocks.back).toHaveBeenCalledWith(SCREEN_ID.ENTER_EMAIL);
    expect(result.current.back.label).toBe('Change email');
  });

  it('returns reset to login without clearing the stored email', () => {
    const { result } = renderHook(() => useVerifyEmail('reset'));

    act(() => result.current.back.onBack());

    expect(timerMocks.reset).toHaveBeenCalledOnce();
    expect(useOnboardDataStore.getState().email).toBe('amy@example.com');
    expect(trackMocks.back).toHaveBeenCalledWith(SCREEN_ID.LOGIN_SCREEN);
    expect(result.current.back.label).toBe('Go back');
  });
});
