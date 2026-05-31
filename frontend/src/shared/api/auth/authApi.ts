import { ApiError, CheckMailRes, VerifyMailRes } from './types';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

const authGoogle = async (idToken: string) => {
  const res = await fetch(`${baseURL}/user/auth/google/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: idToken }),
  });

  if (!res.ok) {
    throw new Error('Google auth failed');
  }
};

const sendCode = async (email: string): Promise<CheckMailRes> => {
  const res = await fetch(`${baseURL}/user/auth/email-start/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email }),
  });

  if (!res.ok) {
    throw new Error('Failed to load data');
  }

  return res.json();
};

const verifyCode = async (
  email: string,
  code: string,
): Promise<VerifyMailRes> => {
  const res = await fetch(`${baseURL}/user/auth/verify-code/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  if (!res.ok) {
    throw new ApiError(
      res.status,
      res.status === 400
        ? 'Check your code again, please'
        : 'Service temporarily unavailable',
    );
  }

  return res.json();
};

const getTokens = async (email: string, password: string) => {
  const res = await fetch(`${baseURL}/user/auth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error('Auth failed');
  }
};

const createPassword = async (token: string, password: string) => {
  const res = await fetch(`${baseURL}/user/auth/set-password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });

  if (!res.ok) {
    throw new Error('Set password failed');
  }
};

const resetPassword = async (email: string): Promise<void> => {
  const res = await fetch(`${baseURL}/user/auth/reset-password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    throw new Error('Reset password failed');
  }
};

const setNewPassword = async (
  token: string,
  newPassword: string,
): Promise<void> => {
  const res = await fetch(`${baseURL}/user/auth/set-new-password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      new_password: newPassword,
      re_new_password: newPassword,
    }),
  });

  if (!res.ok) {
    throw new Error('Set new password failed/');
  }
};

export {
  authGoogle,
  sendCode,
  verifyCode,
  getTokens,
  createPassword,
  resetPassword,
  setNewPassword,
};
