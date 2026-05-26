'use client';

import { screenProps, OnboardProvider, useOnboardDataStore } from './model';
import s from './onBoard.module.scss';
import { DoneScreen, LoginScreen } from './ui';
import { EmailForm, ProfileForm, Track } from './widgets';

const DoneScreenSlide = () => {
  const nickname = useOnboardDataStore(store => store.values.nickname);

  return (
    <Track.Screen index={3} {...screenProps.done} h1Suffix={nickname}>
      <DoneScreen />
    </Track.Screen>
  );
};

export const OnBoard = () => {
  return (
    <OnboardProvider total={4}>
      <main className={s.container}>
        <picture>
          <img src="/onboard_image.jpg" alt="" className={s.image} />
        </picture>

        <Track>
          <Track.Screen index={0} {...screenProps.login}>
            <LoginScreen />
          </Track.Screen>
          <Track.Screen index={1} {...screenProps.email}>
            <EmailForm />
          </Track.Screen>
          <Track.Screen index={2} {...screenProps.personalDataGoogle}>
            <ProfileForm />
          </Track.Screen>
          <DoneScreenSlide />
        </Track>
      </main>
    </OnboardProvider>
  );
};
