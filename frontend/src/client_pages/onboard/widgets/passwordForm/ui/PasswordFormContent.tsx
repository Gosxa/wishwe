import { type ChangeEvent } from 'react';
import { PasswordInput } from '@shared/ui/passwordInput/PasswordInput';
import { ChevronLeft } from '@shared/ui/icons';
import s from './passwordForm.module.scss';

type InputConfig = {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  error?: string;
  helperText?: string;
  isSuccess?: boolean;
};

type SubmitConfig = {
  onSubmit: () => void;
};

type BackConfig = {
  onBack: () => void;
};

type Props = {
  input: InputConfig;
  submit: SubmitConfig;
  back: BackConfig;
};

export const PasswordFormContent = ({ input, submit, back }: Props) => (
  <div className={s.wrapper}>
    <PasswordInput id="password" {...input} />
    <button className={s.submit} onClick={submit.onSubmit}>
      <span>Continue</span>
    </button>
    <button className={s.back} onClick={back.onBack}>
      <ChevronLeft />
      <span>Back</span>
    </button>
  </div>
);
