'use client';

import { useEffect } from 'react';
import { PasswordInput } from '@shared/ui/passwordInput/PasswordInput';
import { HelperText } from '@shared/ui/helperText/HelperText';
import { X } from '@shared/ui/icons';
import { useChangePassword } from '../model/useChangePassword';
import s from './changePasswordModal.module.scss';

type Props = {
  onClose: () => void;
};

export const ChangePasswordModal = ({ onClose }: Props) => {
  const { currentInput, newInput, confirmInput, submit } =
    useChangePassword(onClose);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className={s.overlay}>
      <div
        className={s.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="changePasswordTitle"
      >
        <button
          type="button"
          className={s.close}
          onClick={onClose}
          aria-label="Close"
        >
          <X />
        </button>

        <h2 id="changePasswordTitle" className={s.title}>
          Change password
        </h2>

        <div className={s.form}>
          <div className={s.fields}>
            <PasswordInput
              id="currentPassword"
              label="Current password"
              placeholder="Enter current password"
              {...currentInput}
            />
            <div className={s.withHelper}>
              <PasswordInput
                id="newPassword"
                label="New password"
                placeholder="At least 8 characters"
                {...newInput}
              />
            </div>
            <PasswordInput
              id="confirmNewPassword"
              label="Confirm new password"
              placeholder="Repeat new password"
              {...confirmInput}
            />
          </div>

          {submit.error && (
            <HelperText text={submit.error} type="error" inline />
          )}

          <div className={s.actions}>
            <button type="button" className={s.cancel} onClick={onClose}>
              <span>Cancel</span>
            </button>
            <button
              type="button"
              className={s.save}
              onClick={submit.onSubmit}
              disabled={!submit.isValid}
            >
              <span>Save changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
