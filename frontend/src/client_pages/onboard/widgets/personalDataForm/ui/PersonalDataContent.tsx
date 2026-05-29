import { type ChangeEvent } from 'react';
import { TextInput } from '@shared/ui/textInput/TextInput';
import { Avatar } from '@shared/ui/icons';
import { AvatarCrop } from './avatarCrop/AvatarCrop';
import s from './personalData.module.scss';

type AvatarConfig = {
  url: string | null;
  rawImageUrl: string | null;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onCropConfirm: (croppedUrl: string) => void;
  onCropCancel: () => void;
};

type InputConfig = {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  error?: string;
  helperText?: string;
  isSuccess?: boolean;
  required?: true;
};

type Props = {
  avatar: AvatarConfig;
  nickname: InputConfig;
  firstName: InputConfig;
  lastName: InputConfig;
  submit: { onSubmit: () => void };
};

export const PersonalDataContent = ({
  avatar,
  nickname,
  firstName,
  lastName,
  submit,
}: Props) => (
  <div className={s.wrapper}>
    {avatar.rawImageUrl && (
      <AvatarCrop
        imageSrc={avatar.rawImageUrl}
        onConfirm={avatar.onCropConfirm}
        onCancel={avatar.onCropCancel}
      />
    )}
    <div className={s.avatarWrapper}>
      <label className={s.avatarBtn}>
        {avatar.url ? <img src={avatar.url} alt="avatar" /> : <Avatar />}
        <input type="file" accept="image/*" onChange={avatar.onChange} hidden />
      </label>
      <button className={s.btnCh} onClick={() => avatar.onChange}>
        <span>Change photo</span>
      </button>
    </div>

    <TextInput
      id="nickname"
      label="Your nickname"
      placeholder="e.g. helloworlddb"
      {...nickname}
    />
    <TextInput
      id="firstName"
      label="First Name"
      placeholder="Mariia"
      {...firstName}
    />
    <TextInput
      id="lastName"
      label="Last Name"
      placeholder="Shevchenko"
      {...lastName}
    />
    <button className={s.submit} onClick={submit.onSubmit}>
      <span>{"Let's go"}</span>
    </button>
  </div>
);
