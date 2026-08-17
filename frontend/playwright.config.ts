import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { AUTH_FILE, E2E_EVENT_TITLE, E2E_OWNER } from './e2e/support/constants';

const host = '127.0.0.1';
const frontendPort = 3100;
const backendPort = 8100;
const baseURL = `http://${host}:${frontendPort}`;
const backendURL = `http://${host}:${backendPort}`;

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    locale: 'en-US',
    timezoneId: 'Europe/Kyiv',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command:
        'python manage.py migrate --noinput && ' +
        'python manage.py seed_e2e && ' +
        `python manage.py runserver ${host}:${backendPort} --noreload`,
      cwd: path.resolve(__dirname, '../backend'),
      env: {
        DJANGO_SETTINGS_MODULE: 'wishwe_api.settings_e2e',
        WISHWE_E2E: '1',
        WISHWE_E2E_EMAIL: E2E_OWNER.email,
        WISHWE_E2E_PASSWORD: E2E_OWNER.password,
        WISHWE_E2E_EVENT_TITLE: E2E_EVENT_TITLE,
        WISHWE_E2E_FRONTEND_URL: baseURL,
      },
      url: `${backendURL}/api/health/`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command:
        'npm run build && node e2e/support/prepare-standalone.mjs && ' +
        'node .next/standalone/server.js',
      cwd: __dirname,
      env: {
        HOSTNAME: host,
        NEXT_PUBLIC_BACKEND_URL: backendURL,
        PORT: String(frontendPort),
      },
      url: baseURL,
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
    },
    {
      name: 'firefox',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Firefox'],
        storageState: AUTH_FILE,
      },
    },
    {
      name: 'webkit',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Safari'],
        storageState: AUTH_FILE,
      },
    },
  ],
});
