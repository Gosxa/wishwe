import { type ChangeEvent, useRef } from 'react';
import clsx from 'clsx';
import { TextInput } from '@shared/ui/textInput/TextInput';
import { Avatar } from '@shared/ui/icons';
import { AvatarCrop } from '@shared/ui/avatarCrop/AvatarCrop';
import { HelperText } from '@/shared';
import { TERMS_OF_USE_URL } from '@/shared/lib/legal';
import s from './personalData.module.scss';

type AvatarConfig = {
  url: string | null;
  rawImageUrl: string | null;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onCropConfirm: (croppedUrl: string) => void;
  onCropCancel: () => void;
  onRemove: () => void;
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

type TermsConfig = {
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

type Props = {
  avatar: AvatarConfig;
  nickname: InputConfig;
  firstName: InputConfig;
  lastName: InputConfig;
  terms: TermsConfig;
  submit: { onSubmit: () => void; disabled: boolean };
  submitError?: string;
  inviteLayout?: boolean;
};

export const PersonalDataContent = ({
  avatar,
  nickname,
  firstName,
  lastName,
  terms,
  submit,
  submitError,
  inviteLayout = false,
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={s.wrapper}>
      {avatar.rawImageUrl && (
        <AvatarCrop
          imageSrc={avatar.rawImageUrl}
          onConfirm={avatar.onCropConfirm}
          onCancel={avatar.onCropCancel}
        />
      )}
      <div
        className={clsx(s.avatarWrapper, inviteLayout && s.inviteAvatarWrapper)}
      >
        <div
          className={clsx(
            s.avatarBtnWrap,
            inviteLayout && s.inviteAvatarBtnWrap,
          )}
        >
          <label
            className={clsx(s.avatarBtn, inviteLayout && s.inviteAvatarBtn)}
          >
            {avatar.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar.url}
                alt="avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Avatar />
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={avatar.onChange}
              hidden
            />
          </label>
          {avatar.url && (
            <button className={s.removeAvatarBtn} onClick={avatar.onRemove}>
              ✕
            </button>
          )}
        </div>
        <button
          className={s.btnCh}
          onClick={() => fileInputRef.current?.click()}
        >
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
      <div className={s.terms}>
        <input
          id="terms"
          type="checkbox"
          checked={terms.checked}
          onChange={terms.onChange}
          required
        />
        <span>
          <label htmlFor="terms">I agree to the</label>{' '}
          <a href={TERMS_OF_USE_URL} target="_blank" rel="noopener noreferrer">
            Terms of Use
          </a>
        </span>
      </div>
      {!!submitError && <HelperText type="error" text={submitError} />}
      <button
        className={s.submit}
        onClick={submit.onSubmit}
        disabled={submit.disabled}
      >
        <span>{"Let's go"}</span>
      </button>
    </div>
  );
};
