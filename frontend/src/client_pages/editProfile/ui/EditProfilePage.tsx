'use client';

import type { Profile } from '@/shared/client_api/auth/types';
import { Header } from '@widgets/header';
import { Sidebar } from '@widgets/sidebar';
import { Avatar, Pencil } from '@shared/ui/icons';
import { TextInput } from '@shared/ui/textInput/TextInput';
import { TextArea } from '@shared/ui/textArea/TextArea';
import { Toggle } from '@shared/ui/toggle/Toggle';
import { AvatarCrop } from '@shared/ui/avatarCrop/AvatarCrop';
import { HelperText } from '@shared/ui/helperText/HelperText';
import { useEditProfile } from '../model/useEditProfile';
import s from './editProfilePage.module.scss';

type Props = {
  initialUser: Profile | null;
};

export default function EditProfilePage({ initialUser }: Props) {
  const {
    avatar,
    nickname,
    bio,
    firstName,
    lastName,
    privacy,
    formError,
    isDirty,
    onSubmit,
    onCancel,
  } = useEditProfile(initialUser);

  return (
    <div className={s.shell}>
      <Header />
      <div className={s.body}>
        <Sidebar activeKey="profile" />
        <main className={s.content}>
          <section className={s.card}>
            <h1 className={s.title}>Edit your profile</h1>

            <div className={s.avatarBlock}>
              <span className={s.avatarPreview}>
                {avatar.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar.url} alt="avatar" />
                ) : (
                  <Avatar width={160} height={160} />
                )}
              </span>
              <label className={s.avatarEdit} aria-label="Change photo">
                <Pencil />
                <input
                  type="file"
                  accept="image/*"
                  onChange={avatar.onChange}
                  hidden
                />
              </label>
            </div>

            <div className={s.fields}>
              <TextInput
                id="nickname"
                label="Your nickname"
                placeholder="e.g. helloworlddb"
                {...nickname}
              />
              <TextArea
                id="bio"
                label="Your bio"
                maxLength={150}
                helperText="Up to 150 characters"
                {...bio}
              />
              <div className={s.privacy}>
                <span>Privacy</span>
                <Toggle
                  id="publicProfile"
                  label="Public profile"
                  helperText="If disabled, your profile is hidden from search and can only be seen by your direct friends."
                  {...privacy}
                />
              </div>
              <div className={s.nameRow}>
                <TextInput
                  id="firstName"
                  label="First name"
                  placeholder="Mariia"
                  {...firstName}
                />
                <TextInput
                  id="lastName"
                  label="Last name"
                  placeholder="Shevchenko"
                  {...lastName}
                />
              </div>
            </div>

            {/* TODO: wire to the change-password flow */}
            <span className={s.changePassword}>Change password?</span>

            {formError && <HelperText text={formError} type="error" inline />}

            <div className={s.actions}>
              <button type="button" className={s.cancel} onClick={onCancel}>
                <span>Cancel</span>
              </button>
              <button
                type="button"
                className={s.save}
                onClick={onSubmit}
                disabled={!isDirty}
              >
                <span>Save changes</span>
              </button>
            </div>
          </section>
        </main>
      </div>

      {avatar.rawImageUrl && (
        <AvatarCrop
          imageSrc={avatar.rawImageUrl}
          onConfirm={avatar.onCropConfirm}
          onCancel={avatar.onCropCancel}
        />
      )}
    </div>
  );
}
