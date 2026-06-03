import { Profile } from '@/shared/api/user/types';

export type { Profile };

export type CheckEmailRes = { flow: 'login' | 'register' };

export type VerifyCodeRes = { verification_token: string };

export type RegisterParams = {
  token: string;
  password: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
};
