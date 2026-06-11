'use client';

import { type ChangeEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useValidation } from '@/features/useValidation/useValidation';
import { nicknameSchema } from '@/shared/lib/validation/nickname';
import type { Profile } from '@/shared/client_api/auth/types';
import {
  changeAvatar,
  checkUsername,
  updateProfile,
  UpdateProfileError,
  type UpdateProfilePayload,
} from '@/shared/client_api/user';
import { useUserStore } from '@/shared/store/useUserStore';
import { useLoadingStore } from '@/shared/store/useLoadingStore';

const TAKEN_ERROR = 'Nickname is already taken. Please, choose another one';

export const useEditProfile = (initialUser: Profile | null) => {
  const router = useRouter();
  const storeUser = useUserStore(s => s.user);
  const setUser = useUserStore(s => s.setUser);
  const setLoading = useLoadingStore(s => s.setLoading);

  const user = storeUser ?? initialUser;

  const [nickname, setNickname] = useState(user?.username ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [isPublic, setIsPublic] = useState(!user?.is_private);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar ?? null);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [isUnique, setIsUnique] = useState<boolean | null>(null);
  const [formError, setFormError] = useState<string | undefined>();

  const { error, isSuccess, check, set } = useValidation(nicknameSchema);

  const nicknameChanged = nickname !== (user?.username ?? '');

  const isDirty =
    avatarChanged ||
    nicknameChanged ||
    bio !== (user?.bio ?? '') ||
    firstName !== (user?.first_name ?? '') ||
    lastName !== (user?.last_name ?? '') ||
    isPublic !== !user?.is_private;

  const onNicknameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value.toLowerCase());
    set.error(undefined);
    set.success(false);
    setIsUnique(null);
  };

  const onNicknameBlur = async () => {
    if (!nicknameChanged || !check(nickname)) return;

    try {
      const { available } = await checkUsername(nickname);

      if (available) {
        setIsUnique(true);
      } else {
        setIsUnique(false);
        set.error(TAKEN_ERROR);
      }
    } catch {
      set.error('Service temporarily unavailable');
    }
  };

  const onBioChange = (e: ChangeEvent<HTMLTextAreaElement>) =>
    setBio(e.target.value);

  const onFirstNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    setFirstName(e.target.value);

  const onLastNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    setLastName(e.target.value);

  const onAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => setRawImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onCropConfirm = (croppedUrl: string) => {
    setAvatarUrl(croppedUrl);
    setAvatarChanged(true);
    setRawImageUrl(null);
  };

  const onCropCancel = () => setRawImageUrl(null);

  const onCancel = () => router.push('/profile');

  const onSubmit = async () => {
    if (!user) return;
    setFormError(undefined);

    if (nicknameChanged) {
      if (!check(nickname)) return;

      const { available } = await checkUsername(nickname);

      if (!available) {
        set.error(TAKEN_ERROR);

        return;
      }
    }

    const diff: UpdateProfilePayload = {};

    if (nicknameChanged) diff.username = nickname;
    if (bio !== (user.bio ?? '')) diff.bio = bio;
    if (firstName !== (user.first_name ?? '')) diff.first_name = firstName;
    if (lastName !== (user.last_name ?? '')) diff.last_name = lastName;
    if (isPublic !== !user.is_private) diff.is_private = !isPublic;

    setLoading(true);

    try {
      if (Object.keys(diff).length > 0) await updateProfile(diff);

      let newAvatar: string | undefined;

      if (avatarChanged && avatarUrl) {
        ({ avatar: newAvatar } = await changeAvatar(avatarUrl));
      }

      setUser({ ...user, ...diff, avatar: newAvatar ?? user.avatar });
      router.push('/profile');
    } catch (e) {
      if (e instanceof UpdateProfileError && e.body.username) {
        const message = Array.isArray(e.body.username)
          ? String(e.body.username[0])
          : String(e.body.username);

        set.error(message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    avatar: {
      url: avatarUrl,
      rawImageUrl,
      onChange: onAvatarChange,
      onCropConfirm,
      onCropCancel,
    },
    nickname: {
      value: nickname,
      onChange: onNicknameChange,
      onBlur: onNicknameBlur,
      error,
      helperText: isUnique ? 'The nickname is unique' : undefined,
      isSuccess,
      required: true as const,
    },
    bio: { value: bio, onChange: onBioChange },
    firstName: { value: firstName, onChange: onFirstNameChange },
    lastName: { value: lastName, onChange: onLastNameChange },
    privacy: { checked: isPublic, onChange: setIsPublic },
    formError,
    isDirty,
    onSubmit,
    onCancel,
  };
};
