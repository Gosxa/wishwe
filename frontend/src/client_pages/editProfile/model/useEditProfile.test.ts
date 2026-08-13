// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

const userApiMocks = vi.hoisted(() => ({
  changeAvatar: vi.fn(),
  checkUsername: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigationMocks.push }),
}));

vi.mock('@/shared/client_api/user', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/shared/client_api/user')>();

  return {
    ...actual,
    changeAvatar: userApiMocks.changeAvatar,
    checkUsername: userApiMocks.checkUsername,
    updateProfile: userApiMocks.updateProfile,
  };
});

import type { Profile } from '@/shared/client_api/auth/types';
import { UpdateProfileError } from '@/shared/client_api/user';
import { SOCIAL_MEDIA_URL_HELPER_TEXT } from '@/shared/lib/validation/socialMediaUrl';
import { useLoadingStore } from '@/shared/store/useLoadingStore';
import { useUserStore } from '@/shared/store/useUserStore';
import { useEditProfile } from './useEditProfile';

const profile: Profile = {
  id: 7,
  user: 'amy@example.com',
  user_id: 7,
  username: 'amy',
  first_name: 'Amy',
  last_name: 'Lee',
  bio: 'Weekend explorer',
  date_of_birth: '1995-04-12',
  city: 'Kyiv',
  gender: 'Female',
  avatar: 'https://cdn.example/old-avatar.png',
  social_media_url: 'https://instagram.com/amy',
  is_private: false,
  has_seen_feed_tour: true,
};

const inputChange = (value: string) =>
  ({ target: { value } }) as ChangeEvent<HTMLInputElement>;

const textareaChange = (value: string) =>
  ({ target: { value } }) as ChangeEvent<HTMLTextAreaElement>;

const selectChange = (value: string) =>
  ({ target: { value } }) as ChangeEvent<HTMLSelectElement>;

describe('useEditProfile', () => {
  const setLoading = vi.fn();
  const setUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    userApiMocks.checkUsername.mockResolvedValue({ available: true });
    userApiMocks.updateProfile.mockResolvedValue(profile);
    userApiMocks.changeAvatar.mockResolvedValue({
      avatar: 'https://cdn.example/new-avatar.png',
    });
    useLoadingStore.setState({ isLoading: false, setLoading });
    useUserStore.setState({ user: null, setUser });
  });

  afterEach(() => {
    cleanup();
  });

  it('marks changed fields and a cropped avatar as dirty', () => {
    const { result } = renderHook(() => useEditProfile(profile));

    expect(result.current.isDirty).toBe(false);

    act(() => result.current.bio.onChange(textareaChange('New bio')));
    expect(result.current.isDirty).toBe(true);

    act(() => result.current.bio.onChange(textareaChange(profile.bio ?? '')));
    expect(result.current.isDirty).toBe(false);

    act(() => result.current.privacy.onChange(false));
    expect(result.current.isDirty).toBe(true);

    act(() => result.current.privacy.onChange(true));
    expect(result.current.isDirty).toBe(false);

    act(() => result.current.gender.onChange(selectChange('Other')));
    expect(result.current.isDirty).toBe(true);

    act(() => result.current.gender.onChange(selectChange('Female')));
    expect(result.current.isDirty).toBe(false);

    act(() => result.current.nickname.onChange(inputChange('AMY')));
    expect(result.current.nickname.value).toBe('amy');
    expect(result.current.isDirty).toBe(false);

    act(() =>
      result.current.avatar.onCropConfirm('data:image/png;base64,cropped'),
    );
    expect(result.current.isDirty).toBe(true);
  });

  it('sends only changed fields and stores the merged profile', async () => {
    const { result } = renderHook(() => useEditProfile(profile));

    act(() => result.current.nickname.onChange(inputChange('Amy.Travels')));
    act(() => result.current.bio.onChange(textareaChange('City explorer')));
    act(() => result.current.firstName.onChange(inputChange('Amelia')));
    act(() => result.current.privacy.onChange(false));

    await act(async () => result.current.onSubmit());

    const diff = {
      username: 'amy.travels',
      bio: 'City explorer',
      first_name: 'Amelia',
      is_private: true,
    };

    expect(userApiMocks.checkUsername).toHaveBeenCalledWith('amy.travels');
    expect(userApiMocks.updateProfile).toHaveBeenCalledWith(diff);
    expect(userApiMocks.changeAvatar).not.toHaveBeenCalled();
    expect(setUser).toHaveBeenCalledWith({ ...profile, ...diff });
    expect(navigationMocks.push).toHaveBeenCalledWith('/profile');
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('validates nickname format, availability, and service failures', async () => {
    const { result } = renderHook(() => useEditProfile(profile));

    act(() => result.current.nickname.onChange(inputChange('.hidden')));
    await act(async () => result.current.nickname.onBlur());

    expect(result.current.nickname.error).toBe(
      'Cannot start with underscore or dot',
    );
    expect(userApiMocks.checkUsername).not.toHaveBeenCalled();

    userApiMocks.checkUsername.mockResolvedValueOnce({ available: false });
    act(() => result.current.nickname.onChange(inputChange('taken.name')));
    await act(async () => result.current.nickname.onBlur());

    expect(userApiMocks.checkUsername).toHaveBeenCalledWith('taken.name');
    expect(result.current.nickname.error).toBe(
      'Nickname is already taken. Please, choose another one',
    );

    userApiMocks.checkUsername.mockRejectedValueOnce(new Error('offline'));
    act(() => result.current.nickname.onChange(inputChange('available.name')));
    await act(async () => result.current.nickname.onBlur());

    expect(result.current.nickname.error).toBe(
      'Service temporarily unavailable',
    );
  });

  it('blocks submission for an invalid social media URL', async () => {
    const { result } = renderHook(() => useEditProfile(profile));

    act(() =>
      result.current.socialMediaUrl.onChange(inputChange('instagram.com/amy')),
    );
    act(() => result.current.socialMediaUrl.onBlur());

    expect(result.current.socialMediaUrl.error).toBe(
      SOCIAL_MEDIA_URL_HELPER_TEXT,
    );
    expect(result.current.socialMediaUrl.isSuccess).toBe(false);

    await act(async () => result.current.onSubmit());

    expect(userApiMocks.checkUsername).not.toHaveBeenCalled();
    expect(userApiMocks.updateProfile).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();

    act(() =>
      result.current.socialMediaUrl.onChange(
        inputChange('https://instagram.com/amy.new'),
      ),
    );
    act(() => result.current.socialMediaUrl.onBlur());

    expect(result.current.socialMediaUrl.error).toBeUndefined();
    expect(result.current.socialMediaUrl.isSuccess).toBe(true);
  });

  it('converts cleared birth date and gender fields to null', async () => {
    const { result } = renderHook(() => useEditProfile(profile));

    act(() => result.current.dateOfBirth.onChange(inputChange('')));
    act(() => result.current.gender.onChange(selectChange('')));

    await act(async () => result.current.onSubmit());

    expect(userApiMocks.updateProfile).toHaveBeenCalledWith({
      date_of_birth: null,
      gender: null,
    });
    expect(setUser).toHaveBeenCalledWith({
      ...profile,
      date_of_birth: null,
      gender: null,
    });
  });

  it('uploads and stores an avatar without sending an empty profile patch', async () => {
    const { result } = renderHook(() => useEditProfile(profile));

    act(() =>
      result.current.avatar.onCropConfirm('data:image/png;base64,cropped'),
    );

    await act(async () => result.current.onSubmit());

    expect(userApiMocks.updateProfile).not.toHaveBeenCalled();
    expect(userApiMocks.changeAvatar).toHaveBeenCalledWith(
      'data:image/png;base64,cropped',
    );
    expect(setUser).toHaveBeenCalledWith({
      ...profile,
      avatar: 'https://cdn.example/new-avatar.png',
    });
    expect(navigationMocks.push).toHaveBeenCalledWith('/profile');
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('shows a server username error and keeps the user on the form', async () => {
    userApiMocks.updateProfile.mockRejectedValueOnce(
      new UpdateProfileError({
        username: ['This nickname is not available.'],
      }),
    );
    const { result } = renderHook(() => useEditProfile(profile));

    act(() => result.current.bio.onChange(textareaChange('Changed bio')));
    await act(async () => result.current.onSubmit());

    expect(result.current.nickname.error).toBe(
      'This nickname is not available.',
    );
    expect(result.current.formError).toBeUndefined();
    expect(setUser).not.toHaveBeenCalled();
    expect(navigationMocks.push).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('shows a general save error for an unknown failure', async () => {
    userApiMocks.updateProfile.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useEditProfile(profile));

    act(() => result.current.lastName.onChange(inputChange('Stone')));
    await act(async () => result.current.onSubmit());

    expect(result.current.formError).toBe(
      'Something went wrong. Please try again.',
    );
    expect(setUser).not.toHaveBeenCalled();
    expect(navigationMocks.push).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });
});
