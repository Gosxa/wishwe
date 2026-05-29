'use client';

import { HelperText } from '@shared/ui/helperText/HelperText';
import { PasswordInput } from '@shared/ui/passwordInput/PasswordInput';
import s from './createPassword.module.scss';
import { useCreatePassword } from './useCreatePassword';

type Props = {
  button: string;
};

export const CreatePassword = ({ button }: Props) => {
  const { passwordInput, confirmInput, submit } = useCreatePassword();

  return (
    <div className={s.wrapper}>
      <PasswordInput id="password" {...passwordInput} />
      <PasswordInput id="confirm-password" {...confirmInput} />
      <div className={s.submitWrapper}>
        <button className={s.submit} onClick={submit.onSubmit}>
          <span>{button}</span>
        </button>
        {submit.error && <HelperText type="error" text={submit.error} />}
      </div>
    </div>
  );
};
