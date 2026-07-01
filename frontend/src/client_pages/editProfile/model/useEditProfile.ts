'use client';

import { type ChangeEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useValidation } from '@/features/useValidation/useValidation';
import { nicknameSchema } from '@/shared/lib/validation/nickname';
import { socialMediaUrlSchema } from '@/shared/lib/validation/socialMediaUrl';
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
const PUBLIC_PROFILE_HELPER_ON =
  'Your profile can be found by other users via search.';
const PUBLIC_PROFILE_HELPER_OFF =
  'If disabled, your profile is hidden from search and can only be seen by your direct friends.';

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
  const [socialMediaUrl, setSocialMediaUrl] = useState(
    user?.social_media_url ?? '',
  );
  const [dateOfBirth, setDateOfBirth] = useState(user?.date_of_birth ?? '');
  const [gender, setGender] = useState<string>(user?.gender ?? '');
  const [isPublic, setIsPublic] = useState(!user?.is_private);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar ?? null);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [isUnique, setIsUnique] = useState<boolean | null>(null);
  const [formError, setFormError] = useState<string | undefined>();

  const { error, isSuccess, check, set } = useValidation(nicknameSchema);
  const {
    error: socialError,
    isSuccess: socialSuccess,
    check: checkSocial,
    set: setSocial,
  } = useValidation(socialMediaUrlSchema);

  const nicknameChanged = nickname !== (user?.username ?? '');

  const isDirty =
    avatarChanged ||
    nicknameChanged ||
    bio !== (user?.bio ?? '') ||
    firstName !== (user?.first_name ?? '') ||
    lastName !== (user?.last_name ?? '') ||
    socialMediaUrl !== (user?.social_media_url ?? '') ||
    dateOfBirth !== (user?.date_of_birth ?? '') ||
    gender !== (user?.gender ?? '') ||
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

  const onSocialMediaUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSocialMediaUrl(e.target.value);
    setSocial.error(undefined);
    setSocial.success(false);
  };

  const onSocialMediaUrlBlur = () => {
    if (socialMediaUrl) checkSocial(socialMediaUrl);
  };

  const onDateOfBirthChange = (e: ChangeEvent<HTMLInputElement>) =>
    setDateOfBirth(e.target.value);

  const onGenderChange = (e: ChangeEvent<HTMLSelectElement>) =>
    setGender(e.target.value);

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

    if (!checkSocial(socialMediaUrl)) return;

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
    if (socialMediaUrl !== (user.social_media_url ?? ''))
      diff.social_media_url = socialMediaUrl;
    if (dateOfBirth !== (user.date_of_birth ?? ''))
      diff.date_of_birth = dateOfBirth || null;
    if (gender !== (user.gender ?? ''))
      diff.gender = (gender || null) as Profile['gender'];
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
    socialMediaUrl: {
      value: socialMediaUrl,
      onChange: onSocialMediaUrlChange,
      onBlur: onSocialMediaUrlBlur,
      error: socialError,
      isSuccess: socialSuccess && socialMediaUrl !== '',
    },
    dateOfBirth: { value: dateOfBirth, onChange: onDateOfBirthChange },
    gender: { value: gender, onChange: onGenderChange },
    privacy: {
      checked: isPublic,
      onChange: setIsPublic,
      helperText: isPublic
        ? PUBLIC_PROFILE_HELPER_ON
        : PUBLIC_PROFILE_HELPER_OFF,
    },
    formError,
    isDirty,
    onSubmit,
    onCancel,
  };
};
