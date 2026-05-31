'use client';

import { type ChangeEvent, useState } from 'react';
import { z } from 'zod';
import { useValidation } from '@/features/useValidation/useValidation';
import {
  PersonalDataVariant,
  SCREEN_ID,
  useOnboardDataStore,
  useTrackContext,
} from '@/client_pages/onboard/model';
import { api } from '@/shared';

const HELPER_TEXT = '3-30 characters. Letters, numbers, "." and "_" only.';

const nicknameSchema = z
  .string()
  .min(3, '3 characters min')
  .max(30, '30 characters max')
  .regex(/^[a-zA-Z0-9]/, 'Cannot start with underscore or dot')
  .regex(/^[a-zA-Z0-9._]+$/, HELPER_TEXT)
  .regex(/^[^A-Z]*$/, 'Nickname must be lowercase');

export const usePersonalData = (variant: PersonalDataVariant) => {
  const email = useOnboardDataStore(s => s.email);
  const password = useOnboardDataStore(s => s.password);
  const verificationToken = useOnboardDataStore(s => s.verificationToken);
  const nickname = useOnboardDataStore(s => s.nickname);
  const firstName = useOnboardDataStore(s => s.firstName);
  const lastName = useOnboardDataStore(s => s.lastName);
  const avatarUrl = useOnboardDataStore(s => s.avatarUrl);
  const setField = useOnboardDataStore(s => s.setField);
  const setAvatarUrl = useOnboardDataStore(s => s.setAvatarUrl);
  const setLoading = useOnboardDataStore(s => s.setLoading);
  const { next } = useTrackContext();

  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);

  const { error, isSuccess, check, set } = useValidation(nicknameSchema);

  const onNicknameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setField('nickname', e.target.value.toLowerCase());
    set.error(undefined);
  };

  const onNicknameBlur = async () => {
    if (!check(nickname)) {
      return;
    }

    try {
      const { available } = await api.user.checkNickname(nickname);

      if (!available) {
        set.error('Nickname is already taken. Please, choose another one');
      }
    } catch {
      set.error('Service temporarily unavailable');
    }
  };

  const onFirstNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setField('firstName', e.target.value);
  };

  const onLastNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setField('lastName', e.target.value);
  };

  const onAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;
    setRawImageUrl(URL.createObjectURL(file));
  };

  const onCropConfirm = (croppedUrl: string) => {
    if (rawImageUrl) URL.revokeObjectURL(rawImageUrl);
    setAvatarUrl(croppedUrl);
    setRawImageUrl(null);
  };

  const onCropCancel = () => {
    if (rawImageUrl) URL.revokeObjectURL(rawImageUrl);
    setRawImageUrl(null);
  };

  const onRemoveAvatar = () => {
    setAvatarUrl(null);
  };

  const onSubmit = async () => {
    const { available } = await api.user.checkNickname(nickname);

    if (!check(nickname) || !available) return;
    setLoading(true);

    try {
      if (variant === 'email') {
        if (!verificationToken) {
          return;
        }

        await api.auth.createPassword(verificationToken, password);
      }

      await api.user.onBoard(nickname, firstName, lastName);

      if (avatarUrl) {
        await api.user.changeAvatar(avatarUrl);
      }

      if (variant === 'email') {
        await api.auth.getTokens(email, password);
      }

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
      helperText: error ? undefined : HELPER_TEXT,
      isSuccess,
      required: true as const,
    },
    firstName: { value: firstName, onChange: onFirstNameChange },
    lastName: { value: lastName, onChange: onLastNameChange },
    submit: { onSubmit },
  };
};
