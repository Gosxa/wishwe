'use client';

import { type ChangeEvent, useState } from 'react';
import { useValidation } from '@/features/useValidation/useValidation';
import {
  PersonalDataVariant,
  SCREEN_ID,
  useOnboardDataStore,
  useTrackContext,
} from '@/client_pages/onboard/model';
import { register } from '@/shared/client_api/auth';
import { checkUsername, onBoard, changeAvatar } from '@/shared/client_api/user';
import { useUserStore } from '@/shared/store/useUserStore';
import { useLoadingStore } from '@/shared/store/useLoadingStore';
import {
  NICKNAME_HELPER_TEXT as HELPER_TEXT,
  nicknameSchema,
} from '@/shared/lib/validation/nickname';

export const usePersonalData = (variant: PersonalDataVariant) => {
  const password = useOnboardDataStore(s => s.password);
  const verificationToken = useOnboardDataStore(s => s.verificationToken);
  const nickname = useOnboardDataStore(s => s.nickname);
  const firstName = useOnboardDataStore(s => s.firstName);
  const lastName = useOnboardDataStore(s => s.lastName);
  const avatarUrl = useOnboardDataStore(s => s.avatarUrl);
  const setField = useOnboardDataStore(s => s.setField);
  const setAvatarUrl = useOnboardDataStore(s => s.setAvatarUrl);
  const setLoading = useLoadingStore(s => s.setLoading);
  const resetOnboard = useOnboardDataStore(s => s.reset);
  const setUser = useUserStore(s => s.setUser);
  const { next } = useTrackContext();

  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [isUnique, setIsUnique] = useState<boolean | null>(null);

  const { error, isSuccess, check, set } = useValidation(nicknameSchema);

  const onNicknameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setField('nickname', e.target.value.toLowerCase());
    set.error(undefined);
    setIsUnique(null);
  };

  const onNicknameBlur = async () => {
    if (!check(nickname)) return;

    try {
      const { available } = await checkUsername(nickname);

      if (available) {
        setIsUnique(true);
      } else {
        setIsUnique(false);
        set.error('Nickname is already taken. Please, choose another one');
      }
    } catch {
      set.error('Service temporarily unavailable');
    }
  };

  const onFirstNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    setField('firstName', e.target.value);

  const onLastNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    setField('lastName', e.target.value);

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

  const onRemoveAvatar = () => setAvatarUrl(null);

  const onSubmit = async () => {
    const { available } = await checkUsername(nickname);

    if (!check(nickname) || !available) return;
    setLoading(true);

    try {
      if (variant === 'email') {
        if (!verificationToken) return;

        const user = await register({
          token: verificationToken,
          password,
          username: nickname,
          firstName,
          lastName,
        });

        if (avatarChanged && avatarUrl) {
          const { avatar } = await changeAvatar(avatarUrl);

          setUser({ ...user, avatar });
        } else {
          setUser(user);
        }
      } else {
        await onBoard(nickname, firstName, lastName);

        if (avatarChanged && avatarUrl) await changeAvatar(avatarUrl);
      }

      resetOnboard();
      next(SCREEN_ID.DONE_ONBOARD);
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
      onRemove: onRemoveAvatar,
    },
    nickname: {
      value: nickname,
      onChange: onNicknameChange,
      onBlur: onNicknameBlur,
      error,
      helperText: error
        ? undefined
        : isUnique
          ? 'The nickname is unique'
          : HELPER_TEXT,
      isSuccess,
      required: true as const,
    },
    firstName: { value: firstName, onChange: onFirstNameChange },
    lastName: { value: lastName, onChange: onLastNameChange },
    submit: { onSubmit },
  };
};
