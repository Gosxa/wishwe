import path from 'node:path';

export const AUTH_FILE = path.join(process.cwd(), 'e2e', '.auth', 'owner.json');

export const E2E_OWNER = {
  email: process.env.WISHWE_E2E_EMAIL ?? 'owner.e2e@wishwe.test',
  password: process.env.WISHWE_E2E_PASSWORD ?? 'PlaywrightPass123!',
  username: 'e2e_share_owner',
} as const;

export const E2E_EVENT_TITLE =
  process.env.WISHWE_E2E_EVENT_TITLE ?? 'E2E Share Flow Plan';

export const MAILBOX_DIR =
  process.env.WISHWE_E2E_MAILBOX ??
  path.resolve(process.cwd(), '..', 'backend', '.e2e', 'mail');

export const DISPOSABLE_EMAIL_DOMAIN = 'disposable.e2e.test';

export const DISPOSABLE_PASSWORD = 'DisposablePass123!';
