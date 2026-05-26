'use client';

import { TextInput } from '@/shared/ui/';
import s from './profileForm.module.scss';
import { AvatarCrop } from '../avatarCrop/AvatarCrop';
import { profileFormConfig } from './lib';
import { useProfileForm } from './model';

export const ProfileForm = () => {
  // TODO: add nickname uniq validation
  // TODO: add send request && add image reset && api call && decompose

  const { values, handle, setAvatarUrl, errors, success, isSubmitDisabled } =
    useProfileForm();

  return (
    <form className={s.profileForm}>
      <AvatarCrop onChange={setAvatarUrl} />
      {profileFormConfig.map(config => (
        <TextInput
          key={config.id}
          id={config.id}
          label={config.label}
          placeholder={config.placeholder}
          required={config.required}
          helperText={config.helperText}
          value={values[config.field]}
          onChange={handle.change(config.field)}
          onBlur={handle.blur(config)}
          error={errors[config.field]}
          isSuccess={success[config.field]}
        />
      ))}
      <button
        className={s.btn}
        type="button"
        onClick={handle.submit}
        disabled={isSubmitDisabled}
      >
        <span>Let&apos;s go</span>
      </button>
    </form>
  );
};
