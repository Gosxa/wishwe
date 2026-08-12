import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { emptyResponse, jsonResponse } from '@/shared/client_api/mockResponse';
import { useLoadingStore } from '@/shared/store/useLoadingStore';
import { useUserStore } from '@/shared/store/useUserStore';
import {
  checkEmail,
  login,
  loginWithGoogle,
  logout,
  register,
  resetPassword,
  setNewPassword,
  verifyCode,
} from './index';
import type { Profile } from './types';

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

describe('auth client API', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('window', { location: { href: '/feed' } });
    useUserStore.setState({ user: null });
    useLoadingStore.setState({ isLoading: false });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('checks an email with the expected JSON request', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ flow: 'register' }));

    await expect(checkEmail('new@example.com')).resolves.toEqual({
      flow: 'register',
    });
    expect(fetchMock).toHaveBeenCalledWith('/next_api/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.com' }),
    });
  });

  it('verifies a code and surfaces the backend error or fallback message', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ verification_token: 'verified-token' }),
    );

    await expect(verifyCode('amy@example.com', '123456')).resolves.toEqual({
      verification_token: 'verified-token',
    });
    expect(fetchMock).toHaveBeenLastCalledWith('/next_api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'amy@example.com', code: '123456' }),
    });

    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: 'Code expired' }, 400),
    );
    await expect(verifyCode('amy@example.com', '000000')).rejects.toThrow(
      'Code expired',
    );

    fetchMock.mockResolvedValueOnce(jsonResponse({}, 400));
    await expect(verifyCode('amy@example.com', '000000')).rejects.toThrow(
      'Invalid code',
    );
  });

  it('uses the invalid-code fallback for an empty or malformed error body', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse(400)).mockResolvedValueOnce(
      new Response('not-json', {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(verifyCode('amy@example.com', '000000')).rejects.toThrow(
      'Invalid code',
    );
    await expect(verifyCode('amy@example.com', '000000')).rejects.toThrow(
      'Invalid code',
    );
  });

  it.each([
    {
      name: 'Google login',
      call: () => loginWithGoogle('google-token'),
      url: '/next_api/auth/google',
      body: { token: 'google-token' },
    },
    {
      name: 'password login',
      call: () => login('amy@example.com', 'Password1'),
      url: '/next_api/auth/login',
      body: { email: 'amy@example.com', password: 'Password1' },
    },
    {
      name: 'registration',
      call: () =>
        register({
          token: 'verification-token',
          password: 'Password1',
          username: 'amy',
          firstName: 'Amy',
          lastName: 'Lee',
        }),
      url: '/next_api/auth/register',
      body: {
        token: 'verification-token',
        password: 'Password1',
        username: 'amy',
        firstName: 'Amy',
        lastName: 'Lee',
      },
    },
  ])('performs $name and returns the profile', async ({ call, url, body }) => {
    fetchMock.mockResolvedValueOnce(jsonResponse(profile));

    await expect(call()).resolves.toEqual(profile);
    expect(fetchMock).toHaveBeenCalledWith(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  });

  it.each([
    {
      name: 'email check',
      call: () => checkEmail('amy@example.com'),
      message: 'Failed',
    },
    {
      name: 'Google login',
      call: () => loginWithGoogle('token'),
      message: 'Google auth failed',
    },
    {
      name: 'password login',
      call: () => login('amy@example.com', 'bad'),
      message: 'Auth failed',
    },
    {
      name: 'registration',
      call: () =>
        register({
          token: 'token',
          password: 'Password1',
          username: 'amy',
        }),
      message: 'Registration failed',
    },
  ])(
    'throws the documented error for failed $name',
    async ({ call, message }) => {
      fetchMock.mockResolvedValueOnce(jsonResponse({}, 400));

      await expect(call()).rejects.toThrow(message);
    },
  );

  it('requests a password reset and sets a new password', async () => {
    fetchMock
      .mockResolvedValueOnce(emptyResponse())
      .mockResolvedValueOnce(emptyResponse());

    await expect(resetPassword('amy@example.com')).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/next_api/auth/reset-password',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'amy@example.com' }),
      },
    );

    await expect(
      setNewPassword('reset-token', 'NewPassword1'),
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/next_api/auth/set-new-password',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'reset-token',
          new_password: 'NewPassword1',
          re_new_password: 'NewPassword1',
        }),
      },
    );
  });

  it('rejects failed password reset requests', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse({}, 400));

    await expect(resetPassword('amy@example.com')).rejects.toThrow(
      'Reset failed',
    );
    await expect(setNewPassword('token', 'Password1')).rejects.toThrow(
      'Set new password failed',
    );
  });

  it('logs out with the current email, clears the store, and redirects', async () => {
    useUserStore.setState({ user: profile });
    fetchMock.mockResolvedValueOnce(emptyResponse());

    await logout();

    expect(fetchMock).toHaveBeenCalledWith('/next_api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'amy@example.com' }),
    });
    expect(useLoadingStore.getState().isLoading).toBe(true);
    expect(useUserStore.getState().user).toBeNull();
    expect(window.location.href).toBe('/onboard');
  });

  it('uses an empty email when logging out without a stored user', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse());

    await logout();

    expect(fetchMock).toHaveBeenCalledWith(
      '/next_api/auth/logout',
      expect.objectContaining({ body: JSON.stringify({ email: '' }) }),
    );
  });
});
