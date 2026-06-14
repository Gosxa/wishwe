'use client';

import { type ChangeEvent, useState } from 'react';
import { useValidation } from '@/features/useValidation/useValidation';
import { changePassword, ChangePasswordError } from '@/shared/client_api/user';
import { useLoadingStore } from '@/shared/store/useLoadingStore';
import {
  passwordSchema,
  PASSWORD_HELPER_TEXT,
} from '@/shared/lib/validation/password';

const fieldError = (value: unknown): string | undefined =>
  Array.isArray(value) && value.length > 0 ? String(value[0]) : undefined;

export const useChangePassword = (onClose: () => void) => {
  const setLoading = useLoadingStore(s => s.setLoading);

  const [current, setCurrent] = useState('');
  const [currentError, setCurrentError] = useState<string | undefined>();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | undefined>();

  const { error, isSuccess, check, set } = useValidation(passwordSchema);

  const onCurrentChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCurrent(e.target.value);
    setCurrentError(undefined);
  };

  const onNewChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    set.error(undefined);
  };

  const onNewBlur = () => {
    if (newPassword) check(newPassword);
  };

  const onConfirmChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfirm(e.target.value);
    if (confirmError) setConfirmError(undefined);
  };

  const onConfirmBlur = () => {
    if (confirm && confirm !== newPassword) {
      setConfirmError("Passwords don't match");
    }
  };

  const isValid =
    current.length > 0 &&
    isSuccess &&
    confirm === newPassword &&
    confirm.length > 0;

  const onSubmit = async () => {
    if (!isValid) return;

    setSubmitError(undefined);
    setLoading(true);

    try {
      await changePassword(current, newPassword);
      onClose();
    } catch (e) {
      const body = e instanceof ChangePasswordError ? e.body : {};
      const oldPasswordError =
        (body.error === 'Wrong password' ? body.error : undefined) ??
        fieldError(body.old_password);
      const newPasswordError =
        (body.error === 'New password must be different'
          ? body.error
          : undefined) ?? fieldError(body.new_password);

      if (oldPasswordError) setCurrentError(oldPasswordError);

      if (newPasswordError) {
        set.error(newPasswordError);
        set.success(false);
      }

      if (!oldPasswordError && !newPasswordError) {
        setSubmitError('Service temporarily unavailable');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    currentInput: {
      value: current,
      onChange: onCurrentChange,
      error: currentError,
    },
    newInput: {
      value: newPassword,
      onChange: onNewChange,
      onBlur: onNewBlur,
      error,
      helperText: PASSWORD_HELPER_TEXT,
      isSuccess,
    },
    confirmInput: {
      value: confirm,
      onChange: onConfirmChange,
      onBlur: onConfirmBlur,
      error: confirmError,
    },
    submit: {
      onSubmit,
      error: submitError,
      isValid,
    },
  };
};
