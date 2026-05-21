'use client';

import { OnBoardScreen } from '../onboardScreen/OnBoardScreen';
import s from './loginScreen.module.scss';

const props = {
  h1: 'Get together, finally',
  heading: 'No random people. No noise. Just you and your inner circle',
};

export const LoginScreen = () => {
  return (
    <OnBoardScreen {...props}>
      <button className={s.google}>
        <span>Continue with google G</span>
      </button>
      <span className={s.spacer}>or</span>
      <button className={s.mail}>
        <span>Continue with email</span>
      </button>
    </OnBoardScreen>
  );
};
