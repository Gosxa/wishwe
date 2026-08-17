import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { expect, test as setup } from '@playwright/test';
import { AUTH_FILE, E2E_OWNER } from './support/constants';

setup('authenticate the seeded event owner', async ({ request }) => {
  const response = await request.post('/next_api/auth/login', {
    data: {
      email: E2E_OWNER.email,
      password: E2E_OWNER.password,
    },
  });

  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toMatchObject({
    username: E2E_OWNER.username,
  });

  await mkdir(path.dirname(AUTH_FILE), { recursive: true });
  await request.storageState({ path: AUTH_FILE });
});
