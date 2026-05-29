'use client';

import { TextInput } from '@shared/ui/textInput/TextInput';
import { ChevronLeft } from '@shared/ui/icons';
import { useTrackContext } from '../../../model';
import { useEnterEmail } from '../model/useEnterEmail';
import s from './enterEmail.module.scss';

const SCREEN_INDEX = 1;

export const EnterEmailContent = () => {
  const { move } = useTrackContext();
  const { email, onChange, onBlur, onSubmit, error, helperText, isSuccess } =
    useEnterEmail();

  return (
    <div className={s.wrapper}>
      <TextInput
        id="email"
        label=""
        placeholder="mail@example.com"
        value={email}
        onChange={onChange}
        onBlur={onBlur}
        error={error}
        helperText={helperText}
        isSuccess={isSuccess}
      />
      <button className={s.continue} onClick={onSubmit} disabled={!isSuccess}>
        <span>Continue</span>
      </button>
      <button className={s.back} onClick={() => move.goBack(SCREEN_INDEX)}>
        <ChevronLeft />
        <span>Back to login</span>
      </button>
    </div>
  );
};
