import { type ChangeEvent } from 'react';
import { TextInput } from '@shared/ui/textInput/TextInput';
import { ChevronLeft } from '@shared/ui/icons';
import s from './enterEmail.module.scss';

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

const INPUT_CONFIG = {
  id: 'email',
  label: '',
  placeholder: 'mail@example.com',
} as const;

export const EnterEmailContent = ({ input, submit, back }: Props) => (
  <div className={s.wrapper}>
    <TextInput {...INPUT_CONFIG} {...input} />
    <button className={s.continue} onClick={submit.onSubmit}>
      <span>Continue</span>
    </button>
    <button className={s.back} onClick={back.onBack}>
      <ChevronLeft />
      <span>Back to login</span>
    </button>
  </div>
);
