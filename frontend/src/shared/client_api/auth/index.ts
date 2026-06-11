import { CheckEmailRes, VerifyCodeRes, RegisterParams, Profile } from './types';
import { useUserStore } from '@/shared/store/useUserStore';
import { useLoadingStore } from '@/shared/store/useLoadingStore';

const post = (url: string, body: unknown) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export const checkEmail = async (email: string): Promise<CheckEmailRes> => {
  const res = await post('/next_api/auth/check-email', { email });

  if (!res.ok) throw new Error('Failed');

  return res.json();
};

export const verifyCode = async (
  email: string,
  code: string,
): Promise<VerifyCodeRes> => {
  const res = await post('/next_api/auth/verify-code', { email, code });

  if (!res.ok) {
    const { error } = await res.json();

    throw new Error(error ?? 'Invalid code');
  }

  return res.json();
};

export const loginWithGoogle = async (idToken: string): Promise<Profile> => {
  const res = await post('/next_api/auth/google', { token: idToken });

  if (!res.ok) throw new Error('Google auth failed');

  return res.json();
};

export const login = async (
  email: string,
  password: string,
): Promise<Profile> => {
  const res = await post('/next_api/auth/login', { email, password });

  if (!res.ok) throw new Error('Auth failed');

  return res.json();
};

export const register = async (params: RegisterParams): Promise<Profile> => {
  const res = await post('/next_api/auth/register', params);

  if (!res.ok) throw new Error('Registration failed');

  return res.json();
};

export const resetPassword = async (email: string): Promise<void> => {
  const res = await post('/next_api/auth/reset-password', { email });

  if (!res.ok) throw new Error('Reset failed');
};

export const setNewPassword = async (
  token: string,
  newPassword: string,
): Promise<void> => {
  const res = await post('/next_api/auth/set-new-password', {
    token,
    new_password: newPassword,
    re_new_password: newPassword,
  });

  if (!res.ok) throw new Error('Set new password failed');
};

export const logout = async (): Promise<void> => {
  const { user, clearUser } = useUserStore.getState();

  useLoadingStore.getState().setLoading(true);
  await post('/next_api/auth/logout', { email: user?.user ?? '' });
  clearUser();
  window.location.href = '/onboard';
};
