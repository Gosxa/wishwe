'use client';

import { TextInput } from '@/shared/ui';
import s from './emailForm.module.scss';
import { emailConfig } from './lib/config';
import { useEmailForm } from './model';

export const EmailForm = () => {
  const {
    email,
    error,
    isSuccess,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitDisabled,
    prev,
  } = useEmailForm();

  return (
    <form className={s.emailForm}>
      <TextInput
        id={emailConfig.id}
        label={emailConfig.label}
        placeholder={emailConfig.placeholder}
        required={emailConfig.required}
        helperText={emailConfig.helperText}
        value={email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={error}
        isSuccess={isSuccess}
      />

      <button
        className={s.btn}
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitDisabled}
      >
        <span>Continue</span>
      </button>
      <button className={s.back} type="button" onClick={prev}>
        <span>Back to login</span>
      </button>
    </form>
  );
};
