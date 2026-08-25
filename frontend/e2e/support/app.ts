import { expect, type Locator, type Page } from '@playwright/test';

export const eventCard = (page: Page, title: string): Locator =>
  page.getByRole('article').filter({
    has: page.getByRole('heading', { name: title, exact: true }),
  });

export const ONBOARDING = {
  continueWithEmail: 'Continue with email',
  submitEmail: 'Continue',
  submitCode: 'Verify code',
  submitPassword: 'Set password',
  updatePassword: 'Update password',
  forgotPassword: 'Forgot Password?',
  finish: "Let's go",
  toFeed: 'To feed',
  logIn: 'Log in',
  logInAndJoin: 'Log in & join',
} as const;

export const onboardScreen = (page: Page, heading: string): Locator =>
  page.getByRole('heading', { name: heading, exact: true }).locator('..');

export const fillCode = async (page: Page, code: string) => {
  const cells = page.locator('input[inputmode="numeric"]');

  await expect(cells).toHaveCount(6);

  for (const [index, digit] of [...code].entries()) {
    await cells.nth(index).fill(digit);
  }
};

export const startEmailOnboarding = async (page: Page, email: string) => {
  await page
    .getByRole('button', { name: ONBOARDING.continueWithEmail })
    .click();

  const emailField = page.locator('#email');

  await expect(emailField).toBeVisible();
  await emailField.fill(email);
  await page
    .getByRole('button', { name: ONBOARDING.submitEmail, exact: true })
    .click();
};

export const openSettingsMenu = async (page: Page) => {
  await page.getByRole('button', { name: /^Notifications/ }).waitFor();
  await page.locator('header').getByRole('button').last().click();

  const menu = page.getByRole('region').filter({
    has: page.getByRole('heading', { name: 'Settings' }),
  });

  await expect(menu).toBeVisible();

  return menu;
};

export const openCreateEventModal = async (page: Page) => {
  await page.getByRole('button', { name: 'Create', exact: true }).click();

  const dialog = page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: /^Create a (plan|wish)$/ }),
  });

  await expect(dialog).toBeVisible();

  return dialog;
};

export const fillEventForm = async (
  dialog: Locator,
  fields: {
    category?: string;
    title?: string;
    location?: string;
    description?: string;
    timeframe?: string;
    date?: string;
    time?: string;
    privacy?: 'Friends only' | 'Friends of friends';
  },
) => {
  if (fields.category) {
    await dialog.getByRole('button', { name: fields.category }).click();
  }

  if (fields.title) await dialog.locator('#eventTitle').fill(fields.title);
  if (fields.location) {
    await dialog.locator('#eventLocation').fill(fields.location);
  }

  if (fields.description) {
    await dialog.locator('#eventDescription').fill(fields.description);
  }

  if (fields.timeframe) {
    await dialog.locator('#eventTimeframe').fill(fields.timeframe);
  }

  if (fields.date) {
    await dialog.getByLabel('Event date').fill(fields.date);
  }

  if (fields.time) {
    await dialog.getByLabel('Event time').fill(fields.time);
  }

  if (fields.privacy) {
    await dialog.getByText(fields.privacy, { exact: true }).click();
    await expect(
      dialog.getByRole('radio', { name: fields.privacy }),
    ).toBeChecked();
  }
};

export const categoryChipName = (name: string) =>
  name.charAt(0).toLowerCase() + name.slice(1);

export const isoDateIn = (days: number) => {
  const date = new Date();

  date.setDate(date.getDate() + days);

  return date.toISOString().slice(0, 10);
};

export const movePointerAway = (page: Page) => page.mouse.move(0, 0);

export const setToggle = async (
  scope: Page | Locator,
  name: string,
  checked: boolean,
) => {
  const input = scope.getByRole('switch', { name });

  if ((await input.isChecked()) !== checked) {
    await scope.getByText(name, { exact: true }).click();
  }

  await expect(input).toBeChecked({ checked });
};

const reactValue = (locator: Locator) =>
  locator.evaluate(node => {
    const key = Object.keys(node).find(name =>
      name.startsWith('__reactProps$'),
    );

    if (!key) return null;

    const props = (node as unknown as Record<string, { value?: unknown }>)[key];

    return props?.value ?? null;
  });

export const fillStable = async (locator: Locator, value: string) => {
  await expect
    .poll(
      async () => {
        await locator.fill('');
        await locator.fill(value);

        return reactValue(locator);
      },
      { message: `React never took the value "${value}"` },
    )
    .toBe(value);
};

export const createdEventShareDialog = (page: Page): Locator =>
  page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: /^Share this (plan|wish)$/ }),
  });

export const dismissCreatedEventShare = async (page: Page) => {
  const dialog = createdEventShareDialog(page);

  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Close share dialog' }).click();
  await expect(dialog).toBeHidden();
};
