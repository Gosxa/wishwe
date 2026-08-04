import { ApiError, apiRequest, apiRequestWithResponse } from '@/lib/api/client';
import { readCookie, readSetCookieHeader } from '@/lib/api/cookies';
import { clearSession, saveSession } from '@/lib/auth/session-store';

export type AuthFlow = 'login' | 'register';

export type EmailStartRes = {
  flow: AuthFlow;
};

/**
 * Tells us whether the email belongs to an existing account.
 */
export async function emailStart(email: string): Promise<EmailStartRes> {
  return apiRequest<EmailStartRes>('/api/user/auth/email-start/', {
    method: 'POST',
    body: { email },
  });
}

export async function resendCode(email: string): Promise<void> {
  await apiRequest('/api/user/auth/resend-code/', { method: 'POST', body: { email } });
}

/** Exchanges the 6-digit code for the token that authorises setting a password. */
export async function verifyCode(email: string, code: string): Promise<string> {
  const data = await apiRequest<{ verification_token: string }>(
    '/api/user/auth/verify-code/',
    { method: 'POST', body: { email, code } },
  );

  return data.verification_token;
}

/** Reads the JWT pair out of the response cookies and stores it. */
async function storeSessionFrom(response: Response): Promise<void> {
  const rawSetCookie = readSetCookieHeader(response);
  const access = readCookie(rawSetCookie, 'access_token');

  if (!access) {
    throw new ApiError('Could not read the login session from the server.', 0);
  }

  await saveSession({ access, refresh: readCookie(rawSetCookie, 'refresh_token') });
}

export async function login(email: string, password: string): Promise<void> {
  const { response } = await apiRequestWithResponse('/api/user/auth/token/', {
    method: 'POST',
    body: { email, password },
  });

  await storeSessionFrom(response);
}

/** Final registration step: creates the account and signs the user in. */
export async function createAccount(token: string, password: string): Promise<void> {
  const { response } = await apiRequestWithResponse('/api/user/auth/set-password/', {
    method: 'POST',
    body: { token, password },
  });

  await storeSessionFrom(response);
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/api/user/auth/logout/', { method: 'POST', body: {}, auth: true });
  } catch {
    // Always clear the local session even if the server call fails (network
    // error, expired token) so the user can still sign out on-device.
  }

  await clearSession();
}
