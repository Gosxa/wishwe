'use client';

import { HelperText } from '@shared/ui/helperText/HelperText';
import { PasswordInput } from '@shared/ui/passwordInput/PasswordInput';
import s from './createPassword.module.scss';
import { useCreatePassword } from '../model';
import { CreatePasswordVariant } from '@/client_pages/onboard/model';

const BUTTON_CONFIG: Record<'register' | 'reset', string> = {
  register: 'Set password',
  reset: 'Update password',
};

type Props = {
  variant: CreatePasswordVariant;
};

export const CreatePassword = ({ variant }: Props) => {
  const { passwordInput, confirmInput, submit } = useCreatePassword(variant);

  return (
    <div className={s.wrapper}>
      <PasswordInput
        id="password"
        placeholder="At least 8 characters"
        {...passwordInput}
      />
      {variant === 'reset' && (
        <PasswordInput id="confirm-password" {...confirmInput} />
      )}
      <div className={s.submitWrapper}>
        <button className={s.submit} onClick={submit.onSubmit}>
          <span>{BUTTON_CONFIG[variant]}</span>
        </button>
        {submit.error && <HelperText type="error" text={submit.error} />}
      </div>
    </div>
  );
};
