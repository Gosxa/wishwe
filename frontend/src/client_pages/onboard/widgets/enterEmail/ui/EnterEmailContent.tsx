'use client';

import { TextInput } from '@shared/ui/textInput/TextInput';
import { ChevronLeft } from '@shared/ui/icons';
import { useTrackContext } from '../../../model';
import s from './enterEmail.module.scss';

const SCREEN_INDEX = 1;

export const EnterEmailContent = () => {
  const { move } = useTrackContext();

  return (
    <div className={s.wrapper}>
      <TextInput
        id="email"
        label="Email"
        placeholder="you@example.com"
        value=""
        onChange={() => {}}
      />
      <button className={s.continue} onClick={() => {}}>
        <span>Continue</span>
      </button>
      <button className={s.back} onClick={() => move.goBack(SCREEN_INDEX)}>
        <ChevronLeft />
        <span>Back to login</span>
      </button>
    </div>
  );
};
