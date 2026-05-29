'use client';

import { TrackProvider } from './model';
import s from './onBoard.module.scss';
import { Track } from './ui';
import {
  EnterEmail,
  LoginScreen,
  PasswordForm,
  PersonalDataForm,
  VerifyEmail,
} from './widgets';

export const OnBoard = () => {
  return (
    <TrackProvider>
      <main className={s.container}>
        <picture>
          <img src="/onboard_image.jpg" alt="" className={s.image} />
        </picture>

        <Track>
          <LoginScreen />
          <EnterEmail />
          <VerifyEmail />
          <PasswordForm />
          <PersonalDataForm />
        </Track>
      </main>
    </TrackProvider>
  );
};
