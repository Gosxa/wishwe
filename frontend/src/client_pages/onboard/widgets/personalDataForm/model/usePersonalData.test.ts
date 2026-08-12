// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  register: vi.fn(),
}));

const userApiMocks = vi.hoisted(() => {
  class AcceptInviteError extends Error {
    constructor(public body: Record<string, unknown>) {
      super('Failed to accept invite');
    }
  }

  return {
    acceptInvite: vi.fn(),
    checkUsername: vi.fn(),
    onBoard: vi.fn(),
    changeAvatar: vi.fn(),
    AcceptInviteError,
  };
});

const modelMocks = vi.hoisted(() => ({
  next: vi.fn(),
  invite: null as { token: string } | null,
}));

vi.mock('@/shared/client_api/auth', () => ({
  register: authMocks.register,
}));

vi.mock('@/shared/client_api/user', () => ({
  acceptInvite: userApiMocks.acceptInvite,
  AcceptInviteError: userApiMocks.AcceptInviteError,
  checkUsername: userApiMocks.checkUsername,
  onBoard: userApiMocks.onBoard,
  changeAvatar: userApiMocks.changeAvatar,
}));

vi.mock('@/client_pages/onboard/model', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/client_pages/onboard/model')>();

  return {
    ...actual,
    useTrackContext: () => ({ next: modelMocks.next }),
    useInviteContext: () => modelMocks.invite,
  };
});

import { SCREEN_ID, useOnboardDataStore } from '@/client_pages/onboard/model';
import type { Profile } from '@/shared/client_api/auth/types';
import { NICKNAME_HELPER_TEXT } from '@/shared/lib/validation/nickname';
import { useLoadingStore } from '@/shared/store/useLoadingStore';
import { useUserStore } from '@/shared/store/useUserStore';
import { usePersonalData } from './usePersonalData';

const profile: Profile = {
  id: 7,
  user: 'amy@example.com',
  user_id: 7,
  username: 'amy',
  first_name: 'Amy',
  last_name: 'Lee',
  bio: null,
  date_of_birth: null,
  city: null,
  gender: null,
  avatar: null,
  social_media_url: null,
  is_private: false,
  has_seen_feed_tour: false,
};

const changeEvent = (value: string) =>
  ({ target: { value } }) as ChangeEvent<HTMLInputElement>;

const termsEvent = (checked: boolean) =>
  ({ target: { checked } }) as ChangeEvent<HTMLInputElement>;

describe('usePersonalData', () => {
  const setLoading = vi.fn();
  const setUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    modelMocks.invite = null;
    authMocks.register.mockResolvedValue(profile);
    userApiMocks.acceptInvite.mockResolvedValue(undefined);
    userApiMocks.checkUsername.mockResolvedValue({ available: true });
    userApiMocks.onBoard.mockResolvedValue(undefined);
    userApiMocks.changeAvatar.mockResolvedValue({
      avatar: 'https://cdn.example/new-avatar.png',
    });
    useOnboardDataStore.getState().reset();
    useOnboardDataStore.setState({
      password: 'Password1',
      verificationToken: 'verification-token',
      nickname: 'amy',
      firstName: 'Amy',
      lastName: 'Lee',
    });
    useLoadingStore.setState({ isLoading: false, setLoading });
    useUserStore.setState({ user: null, setUser });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const acceptTerms = (result: {
    current: ReturnType<typeof usePersonalData>;
  }) => {
    act(() => result.current.terms.onChange(termsEvent(true)));
  };

  it('normalizes and validates nickname availability on blur', async () => {
    const { result } = renderHook(() => usePersonalData('email'));

    act(() => result.current.nickname.onChange(changeEvent('Amy.Name')));
    expect(result.current.nickname.value).toBe('amy.name');
    expect(result.current.nickname.helperText).toBe(NICKNAME_HELPER_TEXT);

    await act(async () => result.current.nickname.onBlur());

    expect(userApiMocks.checkUsername).toHaveBeenCalledWith('amy.name');
    expect(result.current.nickname.error).toBeUndefined();
    expect(result.current.nickname.isSuccess).toBe(true);
    expect(result.current.nickname.helperText).toBe('The nickname is unique');
  });

  it('reports taken, invalid, and unavailable-service nicknames', async () => {
    userApiMocks.checkUsername
      .mockResolvedValueOnce({ available: false })
      .mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => usePersonalData('email'));

    await act(async () => result.current.nickname.onBlur());
    expect(result.current.nickname.error).toBe(
      'Nickname is already taken. Please, choose another one',
    );

    act(() => result.current.nickname.onChange(changeEvent('ab')));
    await act(async () => result.current.nickname.onBlur());
    expect(result.current.nickname.error).toBe('3 characters min');
    expect(userApiMocks.checkUsername).toHaveBeenCalledTimes(1);

    act(() => result.current.nickname.onChange(changeEvent('available_name')));
    await act(async () => result.current.nickname.onBlur());
    expect(result.current.nickname.error).toBe(
      'Service temporarily unavailable',
    );
  });

  it('gates submission on terms acceptance', async () => {
    const { result } = renderHook(() => usePersonalData('email'));

    expect(result.current.submit.disabled).toBe(true);
    await act(async () => result.current.submit.onSubmit());

    expect(userApiMocks.checkUsername).not.toHaveBeenCalled();
    expect(authMocks.register).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();

    acceptTerms(result);
    expect(result.current.submit.disabled).toBe(false);
  });

  it('registers an email user, stores the profile, resets onboarding, and advances', async () => {
    const { result } = renderHook(() => usePersonalData('email'));

    acceptTerms(result);

    await act(async () => result.current.submit.onSubmit());

    expect(userApiMocks.checkUsername).toHaveBeenCalledWith('amy');
    expect(authMocks.register).toHaveBeenCalledWith({
      token: 'verification-token',
      password: 'Password1',
      username: 'amy',
      firstName: 'Amy',
      lastName: 'Lee',
    });
    expect(setUser).toHaveBeenCalledWith(profile);
    expect(userApiMocks.changeAvatar).not.toHaveBeenCalled();
    expect(useOnboardDataStore.getState()).toMatchObject({
      password: '',
      verificationToken: null,
      nickname: '',
      firstName: '',
      lastName: '',
    });
    expect(modelMocks.next).toHaveBeenCalledWith(SCREEN_ID.DONE_ONBOARD);
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('uploads a cropped avatar and stores the returned avatar URL', async () => {
    const { result } = renderHook(() => usePersonalData('email'));

    acceptTerms(result);

    act(() =>
      result.current.avatar.onCropConfirm('data:image/png;base64,cropped'),
    );
    expect(result.current.avatar.url).toBe('data:image/png;base64,cropped');
    expect(result.current.avatar.rawImageUrl).toBeNull();

    await act(async () => result.current.submit.onSubmit());

    expect(userApiMocks.changeAvatar).toHaveBeenCalledWith(
      'data:image/png;base64,cropped',
    );
    expect(setUser).toHaveBeenCalledWith({
      ...profile,
      avatar: 'https://cdn.example/new-avatar.png',
    });
  });

  it('reads an avatar file and supports crop cancellation and removal', () => {
    const readAsDataURL = vi.fn();

    class FileReaderMock {
      result = 'data:image/png;base64,raw';
      onloadend: (() => void) | null = null;

      readAsDataURL = (file: Blob) => {
        readAsDataURL(file);
        this.onloadend?.();
      };
    }

    vi.stubGlobal('FileReader', FileReaderMock);
    const { result } = renderHook(() => usePersonalData('email'));
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    act(() =>
      result.current.avatar.onChange({
        target: { files: [file] },
      } as unknown as ChangeEvent<HTMLInputElement>),
    );

    expect(readAsDataURL).toHaveBeenCalledWith(file);
    expect(result.current.avatar.rawImageUrl).toBe('data:image/png;base64,raw');

    act(() => result.current.avatar.onCropCancel());
    expect(result.current.avatar.rawImageUrl).toBeNull();

    act(() =>
      result.current.avatar.onCropConfirm('data:image/png;base64,cropped'),
    );
    act(() => result.current.avatar.onRemove());
    expect(result.current.avatar.url).toBeNull();
  });

  it('completes Google onboarding, uploads an avatar, and accepts an invite', async () => {
    modelMocks.invite = { token: 'invite-token' };
    const { result } = renderHook(() => usePersonalData('google'));

    acceptTerms(result);
    act(() =>
      result.current.avatar.onCropConfirm('data:image/png;base64,cropped'),
    );

    await act(async () => result.current.submit.onSubmit());

    expect(userApiMocks.onBoard).toHaveBeenCalledWith('amy', 'Amy', 'Lee');
    expect(userApiMocks.changeAvatar).toHaveBeenCalledWith(
      'data:image/png;base64,cropped',
    );
    expect(authMocks.register).not.toHaveBeenCalled();
    expect(userApiMocks.acceptInvite).toHaveBeenCalledWith('invite-token');
    expect(modelMocks.next).toHaveBeenCalledWith(SCREEN_ID.INVITE_REQUEST_SENT);
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('stops for an unavailable nickname and restores loading', async () => {
    userApiMocks.checkUsername.mockResolvedValueOnce({ available: false });
    const { result } = renderHook(() => usePersonalData('email'));

    acceptTerms(result);

    await act(async () => result.current.submit.onSubmit());

    expect(result.current.nickname.error).toBe(
      'Nickname is already taken. Please, choose another one',
    );
    expect(authMocks.register).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('handles username-check failures during submission and restores loading', async () => {
    userApiMocks.checkUsername.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => usePersonalData('email'));

    acceptTerms(result);

    await act(async () => result.current.submit.onSubmit());

    expect(result.current.submitError).toBe('Service temporarily unavailable');
    expect(authMocks.register).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('shows generic registration failures and always restores loading', async () => {
    authMocks.register.mockRejectedValueOnce(new Error('registration failed'));
    const { result } = renderHook(() => usePersonalData('email'));

    acceptTerms(result);

    await act(async () => result.current.submit.onSubmit());

    expect(result.current.submitError).toBe('Service temporarily unavailable');
    expect(modelMocks.next).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('shows the invite-specific error and does not reset onboarding state', async () => {
    modelMocks.invite = { token: 'used-token' };
    userApiMocks.acceptInvite.mockRejectedValueOnce(
      new userApiMocks.AcceptInviteError({ detail: 'used' }),
    );
    const { result } = renderHook(() => usePersonalData('email'));

    acceptTerms(result);

    await act(async () => result.current.submit.onSubmit());

    expect(result.current.submitError).toBe(
      'Unable to accept invite. Please try again.',
    );
    expect(useOnboardDataStore.getState().nickname).toBe('amy');
    expect(modelMocks.next).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('clears loading when the verification token is unexpectedly missing', async () => {
    useOnboardDataStore.setState({ verificationToken: null });
    const { result } = renderHook(() => usePersonalData('email'));

    acceptTerms(result);

    await act(async () => result.current.submit.onSubmit());

    expect(authMocks.register).not.toHaveBeenCalled();
    expect(modelMocks.next).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
    expect(result.current.nickname.helperText).not.toBe(
      'The nickname is unique',
    );
  });
});
