'use client';

import { type ChangeEvent, useState } from 'react';
import { z } from 'zod';
import { useValidation } from '@/features/useValidation/useValidation';
import {
  SCREEN_INDEX,
  useOnboardDataStore,
  useTrackContext,
} from '@/client_pages/onboard/model';
import { api } from '@/shared';

const HELPER_TEXT = '3-30 characters. Letters, numbers, "." and "_" only.';

const nicknameSchema = z
  .string()
  .min(3, HELPER_TEXT)
  .max(30, HELPER_TEXT)
  .regex(/^[a-zA-Z0-9]/, 'Cannot start with underscore or dot')
  .regex(/^[a-zA-Z0-9._]+$/, HELPER_TEXT);

export const usePersonalData = () => {
  const nickname = useOnboardDataStore(s => s.nickname);
  const firstName = useOnboardDataStore(s => s.firstName);
  const lastName = useOnboardDataStore(s => s.lastName);
  const avatarUrl = useOnboardDataStore(s => s.avatarUrl);
  const setField = useOnboardDataStore(s => s.setField);
  const setAvatarUrl = useOnboardDataStore(s => s.setAvatarUrl);
  const setLoading = useOnboardDataStore(s => s.setLoading);
  const { move } = useTrackContext();

  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);

  const { error, isSuccess, check, set } = useValidation(nicknameSchema);

  const onNicknameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setField('nickname', e.target.value);
    set.error(undefined);
  };

  const onNicknameBlur = () => {
    if (nickname) check(nickname);
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
    setAvatarUrl(croppedUrl);
    setRawImageUrl(null);
  };

  const onCropCancel = () => setRawImageUrl(null);

  const onSubmit = async () => {
    if (!check(nickname)) return;
    setLoading(true);

    try {
      await api.user.onBoard(nickname, firstName, lastName);
      move.goForward(SCREEN_INDEX.PERSONAL_DATA + 1);
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
      helperText: error ? undefined : HELPER_TEXT,
      isSuccess,
      required: true as const,
    },
    firstName: { value: firstName, onChange: onFirstNameChange },
    lastName: { value: lastName, onChange: onLastNameChange },
    submit: { onSubmit },
  };
};
