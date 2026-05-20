'use client';

import { OnBoardScreen } from '../onboardScreen/OnBoardScreen';
import s from './registerGoogle.module.scss';

const props = {
  h1: 'Is this you?',
  heading: `We've pulled your info from Google. Make sure it looks right before joining the circle`,
};

export const RegisterGoogle = () => {
  return (
    <OnBoardScreen {...props}>
      <div></div>
      <span>Change photo</span>
    </OnBoardScreen>
  );
};
