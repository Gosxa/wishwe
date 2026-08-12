// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  checkEmail: vi.fn(),
}));

const trackMocks = vi.hoisted(() => ({
  next: vi.fn(),
  back: vi.fn(),
}));

vi.mock('@/shared/client_api/auth', () => ({
  checkEmail: authMocks.checkEmail,
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
import { useEnterEmail } from './useEnterEmail';

const changeEvent = (value: string) =>
  ({ target: { value } }) as ChangeEvent<HTMLInputElement>;

describe('useEnterEmail', () => {
  const setLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.checkEmail.mockResolvedValue({ flow: 'register' });
    useOnboardDataStore.getState().reset();
    useLoadingStore.setState({ isLoading: false, setLoading });
  });

  afterEach(() => {
    cleanup();
  });

  it('validates email input before making a request', async () => {
    const { result } = renderHook(() => useEnterEmail());

    act(() => result.current.input.onChange(changeEvent('not-an-email')));
    await act(async () => result.current.submit.onSubmit());

    expect(result.current.input.error).toBe('please, enter valid email');
    expect(result.current.input.isSuccess).toBe(false);
    expect(authMocks.checkEmail).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
  });

  it('validates on blur and clears the previous error while typing', () => {
    const { result } = renderHook(() => useEnterEmail());

    act(() => result.current.input.onChange(changeEvent('invalid')));
    act(() => result.current.input.onBlur());
    expect(result.current.input.error).toBe('please, enter valid email');

    act(() => result.current.input.onChange(changeEvent('amy@example.com')));
    expect(result.current.input.error).toBeUndefined();

    act(() => result.current.input.onBlur());
    expect(result.current.input.isSuccess).toBe(true);
    expect(result.current.input.helperText).toBe('OK');
  });

  it.each([
    ['login', SCREEN_ID.ENTER_PWD],
    ['register', SCREEN_ID.VERIFY_REGISTER],
  ] as const)(
    'routes the %s email flow to its next screen',
    async (flow, screen) => {
      authMocks.checkEmail.mockResolvedValueOnce({ flow });
      useOnboardDataStore.setState({ email: 'amy@example.com' });
      const { result } = renderHook(() => useEnterEmail());

      await act(async () => result.current.submit.onSubmit());

      expect(authMocks.checkEmail).toHaveBeenCalledWith('amy@example.com');
      expect(trackMocks.next).toHaveBeenCalledWith(screen);
      expect(setLoading.mock.calls).toEqual([[true], [false]]);
    },
  );

  it('shows a service error and always restores loading after failure', async () => {
    authMocks.checkEmail.mockRejectedValueOnce(new Error('offline'));
    useOnboardDataStore.setState({ email: 'amy@example.com' });
    const { result } = renderHook(() => useEnterEmail());

    await act(async () => result.current.submit.onSubmit());

    expect(result.current.input.error).toBe('Service temporarily unavailable');
    expect(trackMocks.next).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('returns to the login screen', () => {
    const { result } = renderHook(() => useEnterEmail());

    act(() => result.current.back.onBack());

    expect(trackMocks.back).toHaveBeenCalledWith(SCREEN_ID.LOGIN_SCREEN);
  });
});
