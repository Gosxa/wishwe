import { postJson } from '@/lib/api/client';

export type AuthFlow = 'login' | 'register';

export type CheckEmailRes = {
  flow: AuthFlow;
};

export async function checkEmail(email: string): Promise<CheckEmailRes> {
  return postJson<CheckEmailRes>('/api/user/auth/email-start/', { email });
}
