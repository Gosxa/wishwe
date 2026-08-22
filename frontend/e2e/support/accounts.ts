import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  expect,
  request as playwrightRequest,
  type APIRequestContext,
} from '@playwright/test';
import { DISPOSABLE_EMAIL_DOMAIN, DISPOSABLE_PASSWORD } from './constants';
import { waitForVerificationCode } from './mailbox';

export type DisposableAccount = {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
  userId: number;
  profileId: number;
  api: APIRequestContext;
  storageState: string;
};

let sequence = 0;

const uniqueSuffix = () => {
  sequence += 1;

  return `${Date.now().toString(36)}${sequence.toString(36)}`;
};

export const registerDisposableAccount = async (
  baseURL: string,
  slug: string,
  options: { skipFeedTour?: boolean } = {},
): Promise<DisposableAccount> => {
  const suffix = uniqueSuffix();
  const username = `${slug}_${suffix}`.slice(0, 30);
  const email = `${username}@${DISPOSABLE_EMAIL_DOMAIN}`;
  const firstName = 'Test';
  const lastName = slug;

  const api = await playwrightRequest.newContext({ baseURL });

  const start = await api.post('/next_api/auth/check-email', {
    data: { email },
  });

  expect(start.status(), 'check-email should accept a fresh address').toBe(200);
  await expect(start.json()).resolves.toMatchObject({ flow: 'register' });

  const code = await waitForVerificationCode(email);

  const verified = await api.post('/next_api/auth/verify-code', {
    data: { email, code },
  });

  expect(verified.status(), `verify-code rejected ${code}`).toBe(200);

  const { verification_token: token } = (await verified.json()) as {
    verification_token: string;
  };

  const registered = await api.post('/next_api/auth/register', {
    data: {
      token,
      password: DISPOSABLE_PASSWORD,
      username,
      firstName,
      lastName,
    },
  });

  expect(registered.status(), 'register should complete onboarding').toBe(200);

  const profile = (await registered.json()) as {
    id: number;
    user_id: number;
    username: string;
  };

  expect(profile.username).toBe(username);

  if (options.skipFeedTour !== false) {
    const dismissed = await api.post('/next_api/user/feed-tour');

    expect(dismissed.ok(), 'failed to dismiss the feed tour').toBe(true);
  }

  const storageState = path.join(
    process.cwd(),
    'e2e',
    '.auth',
    `${username}.json`,
  );

  await mkdir(path.dirname(storageState), { recursive: true });
  await api.storageState({ path: storageState });

  return {
    email,
    password: DISPOSABLE_PASSWORD,
    username,
    firstName,
    lastName,
    userId: profile.user_id,
    profileId: profile.id,
    api,
    storageState,
  };
};

export const disposableCredentials = (slug: string) => {
  const username = `${slug}_${uniqueSuffix()}`.slice(0, 30);

  return {
    username,
    email: `${username}@${DISPOSABLE_EMAIL_DOMAIN}`,
    password: DISPOSABLE_PASSWORD,
  };
};

export const anonymousState = async (filePath: string) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify({ cookies: [], origins: [] }));

  return filePath;
};
