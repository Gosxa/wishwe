// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const userApiMocks = vi.hoisted(() => ({
  changePassword: vi.fn(),
}));

vi.mock('@/shared/client_api/user', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/shared/client_api/user')>();

  return { ...actual, changePassword: userApiMocks.changePassword };
});

import { ChangePasswordError } from '@/shared/client_api/user';
import { PASSWORD_HELPER_TEXT } from '@/shared/lib/validation/password';
import { useLoadingStore } from '@/shared/store/useLoadingStore';
import { useChangePassword } from './useChangePassword';

const changeEvent = (value: string) =>
  ({ target: { value } }) as ChangeEvent<HTMLInputElement>;

const fillValidForm = (result: {
  current: ReturnType<typeof useChangePassword>;
}) => {
  act(() => result.current.currentInput.onChange(changeEvent('Current1')));
  act(() => result.current.newInput.onChange(changeEvent('NewPassword2')));
  act(() => result.current.newInput.onBlur());
  act(() => result.current.confirmInput.onChange(changeEvent('NewPassword2')));
};

describe('useChangePassword', () => {
  const setLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    userApiMocks.changePassword.mockResolvedValue(undefined);
    useLoadingStore.setState({ isLoading: false, setLoading });
  });

  afterEach(() => {
    cleanup();
  });

  it('validates password strength and matching confirmation', async () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useChangePassword(onClose));

    act(() => result.current.currentInput.onChange(changeEvent('Current1')));
    act(() => result.current.newInput.onChange(changeEvent('short')));
    act(() => result.current.newInput.onBlur());

    expect(result.current.newInput.error).toBe(PASSWORD_HELPER_TEXT);
    expect(result.current.submit.isValid).toBe(false);

    await act(async () => result.current.submit.onSubmit());
    expect(userApiMocks.changePassword).not.toHaveBeenCalled();

    act(() => result.current.newInput.onChange(changeEvent('NewPassword2')));
    act(() => result.current.newInput.onBlur());
    act(() =>
      result.current.confirmInput.onChange(changeEvent('OtherPassword3')),
    );
    act(() => result.current.confirmInput.onBlur());

    expect(result.current.confirmInput.error).toBe("Passwords don't match");
    expect(result.current.submit.isValid).toBe(false);

    act(() =>
      result.current.confirmInput.onChange(changeEvent('NewPassword2')),
    );

    expect(result.current.confirmInput.error).toBeUndefined();
    expect(result.current.submit.isValid).toBe(true);
  });

  it('changes a valid password, closes the modal, and restores loading', async () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useChangePassword(onClose));

    fillValidForm(result);
    await act(async () => result.current.submit.onSubmit());

    expect(userApiMocks.changePassword).toHaveBeenCalledWith(
      'Current1',
      'NewPassword2',
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
    expect(result.current.submit.error).toBeUndefined();
  });

  it.each([
    {
      body: { error: 'Wrong password' },
      target: 'current',
      message: 'Wrong password',
    },
    {
      body: { old_password: ['The current password is incorrect.'] },
      target: 'current',
      message: 'The current password is incorrect.',
    },
    {
      body: { error: 'New password must be different' },
      target: 'new',
      message: 'New password must be different',
    },
    {
      body: { new_password: ['This password is too common.'] },
      target: 'new',
      message: 'This password is too common.',
    },
  ])(
    'maps a $target password error to its input',
    async ({ body, target, message }) => {
      const onClose = vi.fn();

      userApiMocks.changePassword.mockRejectedValueOnce(
        new ChangePasswordError(body),
      );
      const { result } = renderHook(() => useChangePassword(onClose));

      fillValidForm(result);
      await act(async () => result.current.submit.onSubmit());

      expect(
        target === 'current'
          ? result.current.currentInput.error
          : result.current.newInput.error,
      ).toBe(message);
      expect(result.current.submit.error).toBeUndefined();
      expect(onClose).not.toHaveBeenCalled();
      expect(setLoading.mock.calls).toEqual([[true], [false]]);

      if (target === 'new') {
        expect(result.current.newInput.isSuccess).toBe(false);
        expect(result.current.submit.isValid).toBe(false);
      }
    },
  );

  it('shows a general error when the server gives no field error', async () => {
    const onClose = vi.fn();

    userApiMocks.changePassword.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useChangePassword(onClose));

    fillValidForm(result);
    await act(async () => result.current.submit.onSubmit());

    expect(result.current.submit.error).toBe('Service temporarily unavailable');
    expect(result.current.currentInput.error).toBeUndefined();
    expect(result.current.newInput.error).toBeUndefined();
    expect(onClose).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });
});
