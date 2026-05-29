'use client';

import { HelperText } from '@shared/ui/helperText/HelperText';
import { PasswordInput } from '@shared/ui/passwordInput/PasswordInput';
import { useLoginPassword } from './useLoginPassword';
import s from './loginPassword.module.scss';

export const LoginPassword = () => {
  const { input, submit, forgot } = useLoginPassword();

  return (
    <div className={s.wrapper}>
      <PasswordInput id="password" {...input} />
      <div className={s.submitWrapper}>
        <button className={s.logIn} onClick={submit.onSubmit}>
          <span>Log in</span>
        </button>
        {submit.error && <HelperText type="error" text={submit.error} />}
      </div>
      <div className={s.forgotWrapper}>
        <button className={s.forgot} onClick={forgot.onForgot}>
          <span>Forgot Password?</span>
        </button>
        {forgot.error && <HelperText type="error" text={forgot.error} />}
      </div>
    </div>
  );
};
