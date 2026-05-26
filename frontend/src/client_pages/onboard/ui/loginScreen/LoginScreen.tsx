'use client';

import { useOnboardContext } from '../../model';
import s from './loginScreen.module.scss';

export const LoginScreen = () => {
  const { goTo } = useOnboardContext();

  return (
    <>
      <button className={s.google} onClick={() => goTo(2)}>
        <span>Continue with google G</span>
      </button>
      <span className={s.spacer}>or</span>
      <button className={s.mail} onClick={() => goTo(1)}>
        <span>Continue with email</span>
      </button>
    </>
  );
};
