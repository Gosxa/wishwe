import type { Browser, Page } from '@playwright/test';
import { expect, test, expectNoA11yViolations } from './support/test';
import {
  registerDisposableAccount,
  type DisposableAccount,
} from './support/accounts';
import { createPlan } from './support/fixtures';
import { eventCard, fillStable, setToggle } from './support/app';

type Owner = {
  account: DisposableAccount;
  page: Page;
  close: () => Promise<void>;
};

const signedIn = async (
  browser: Browser,
  baseURL: string,
  slug: string,
): Promise<Owner> => {
  const account = await registerDisposableAccount(baseURL, slug);
  const context = await browser.newContext({
    storageState: account.storageState,
  });

  return {
    account,
    page: await context.newPage(),
    close: async () => {
      await context.close();
      await account.api.dispose();
    },
  };
};

const PNG_FIXTURE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAHElEQVQI12P4z8DwHwAF/wI/BiE7' +
    'ywAAAABJRU5ErkJggg==',
  'base64',
);

const avatarFile = {
  name: 'avatar.png',
  mimeType: 'image/png',
  buffer: PNG_FIXTURE,
};

test.describe('profile', () => {
  test('shows the owner’s events and links out to editing', async ({
    browser,
    baseURL,
  }) => {
    const owner = await signedIn(browser, baseURL!, 'profileview');

    try {
      await createPlan(owner.account.api, { title: 'Profile page plan' });

      await owner.page.goto('/profile');

      await expect(
        owner.page.getByRole('heading', {
          name: `@${owner.account.username}`,
        }),
      ).toBeVisible();
      await expect(eventCard(owner.page, 'Profile page plan')).toBeVisible();

      await owner.page.getByRole('link', { name: 'Edit profile' }).click();
      await expect(owner.page).toHaveURL('/edit-profile');
    } finally {
      await owner.close();
    }
  });

  test('saves an edited nickname, bio and privacy toggle', async ({
    browser,
    baseURL,
  }) => {
    const owner = await signedIn(browser, baseURL!, 'profileedit');
    const { page } = owner;
    const nickname = `${owner.account.username}x`.slice(0, 30);

    try {
      await page.goto('/edit-profile');

      const save = page.getByRole('button', { name: 'Save changes' });

      await expect(save).toBeDisabled();

      await fillStable(page.locator('#nickname'), nickname);
      await fillStable(page.locator('#bio'), 'Here for the picnics.');
      await setToggle(page, 'Public profile', false);

      await expect(save).toBeEnabled();
      await save.click();

      await expect(page).toHaveURL('/profile');
      await expect(
        page.getByRole('heading', { name: `@${nickname}` }),
      ).toBeVisible();
      await expect(page.getByText('Here for the picnics.')).toBeVisible();

      await page.goto('/edit-profile');
      await expect(page.locator('#nickname')).toHaveValue(nickname);
      await expect(page.locator('#bio')).toHaveValue('Here for the picnics.');
      await expect(
        page.getByRole('switch', { name: 'Public profile' }),
      ).not.toBeChecked();
    } finally {
      await owner.close();
    }
  });

  test('refuses a nickname that is already taken', async ({
    browser,
    baseURL,
  }) => {
    const owner = await signedIn(browser, baseURL!, 'profiledupe');
    const other = await registerDisposableAccount(baseURL!, 'profiletaken');

    try {
      await owner.page.goto('/edit-profile');
      await fillStable(owner.page.locator('#nickname'), other.username);
      await owner.page.locator('#nickname').blur();

      await expect(owner.page.getByText(/already taken/i)).toBeVisible();

      await owner.page.getByRole('button', { name: 'Save changes' }).click();

      await expect(owner.page).toHaveURL('/edit-profile');
    } finally {
      await other.api.dispose();
      await owner.close();
    }
  });

  test('uploads and crops a new avatar', async ({ browser, baseURL }) => {
    const owner = await signedIn(browser, baseURL!, 'profileavatar');
    const { page } = owner;

    try {
      await page.goto('/edit-profile');

      await page.locator('input[type="file"]').setInputFiles(avatarFile);

      const cropper = page.getByRole('dialog', { name: 'Crop profile photo' });

      await expect(cropper).toBeVisible();
      await cropper.getByRole('button', { name: 'Apply' }).click();
      await expect(cropper).toBeHidden();

      const preview = page.getByRole('img', { name: 'avatar' });

      await expect(preview).toBeVisible();
      await expect(preview).toHaveAttribute('src', /^data:image\//);

      await page.getByRole('button', { name: 'Save changes' }).click();
      await expect(page).toHaveURL('/profile');

      const saved = page.getByRole('img', { name: owner.account.username });

      await expect(saved).toBeVisible();
      await expect(saved).not.toHaveAttribute('src', /^data:/);
    } finally {
      await owner.close();
    }
  });

  test('backs out of cropping without touching the avatar', async ({
    browser,
    baseURL,
  }) => {
    const owner = await signedIn(browser, baseURL!, 'profilenocrop');
    const { page } = owner;

    try {
      await page.goto('/edit-profile');
      await page.locator('input[type="file"]').setInputFiles(avatarFile);

      const cropper = page.getByRole('dialog', { name: 'Crop profile photo' });

      await expect(cropper).toBeVisible();
      await cropper.getByRole('button', { name: 'Cancel' }).click();

      await expect(cropper).toBeHidden();
      await expect(page.getByRole('img', { name: 'avatar' })).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: 'Save changes' }),
      ).toBeDisabled();
    } finally {
      await owner.close();
    }
  });

  test('changes the password and signs in again with the new one', async ({
    browser,
    baseURL,
  }) => {
    const owner = await signedIn(browser, baseURL!, 'profilepwd');
    const { page, account } = owner;
    const newPassword = 'RotatedPass456!';

    try {
      await page.goto('/edit-profile');
      await page.getByRole('button', { name: 'Change password?' }).click();

      const modal = page.getByRole('dialog', { name: 'Change password' });

      await expect(modal).toBeVisible();

      const save = modal.getByRole('button', { name: 'Save changes' });

      await expect(save).toBeDisabled();

      await modal.locator('#currentPassword').fill(account.password);
      await modal.locator('#newPassword').fill(newPassword);
      await modal.locator('#newPassword').blur();
      await modal.locator('#confirmNewPassword').fill(newPassword);

      await expect(save).toBeEnabled();
      await save.click();
      await expect(modal).toBeHidden();

      const stale = await account.api.post('/next_api/auth/login', {
        data: { email: account.email, password: account.password },
      });

      expect(stale.ok()).toBe(false);

      const fresh = await account.api.post('/next_api/auth/login', {
        data: { email: account.email, password: newPassword },
      });

      expect(fresh.status()).toBe(200);
    } finally {
      await owner.close();
    }
  });

  test('rejects a wrong current password', async ({ browser, baseURL }) => {
    const owner = await signedIn(browser, baseURL!, 'profilebadpwd');
    const { page } = owner;

    try {
      await page.goto('/edit-profile');
      await page.getByRole('button', { name: 'Change password?' }).click();

      const modal = page.getByRole('dialog', { name: 'Change password' });

      await modal.locator('#currentPassword').fill('NotMyPassword123!');
      await modal.locator('#newPassword').fill('SomethingElse123!');
      await modal.locator('#newPassword').blur();
      await modal.locator('#confirmNewPassword').fill('SomethingElse123!');
      await modal.getByRole('button', { name: 'Save changes' }).click();

      await expect(modal).toBeVisible();
      await expect(modal.getByText('Wrong password')).toBeVisible();
    } finally {
      await owner.close();
    }
  });

  test('keeps the profile and edit pages free of new accessibility violations', async ({
    browser,
    baseURL,
  }) => {
    const owner = await signedIn(browser, baseURL!, 'profileaxe');
    const { page } = owner;

    try {
      await createPlan(owner.account.api, { title: 'Accessible profile plan' });

      await page.goto('/profile');
      await expect(eventCard(page, 'Accessible profile plan')).toBeVisible();
      await expectNoA11yViolations(page);

      await page.goto('/edit-profile');
      await expect(
        page.getByRole('heading', { name: 'Edit your profile' }),
      ).toBeVisible();
      await expectNoA11yViolations(page);
    } finally {
      await owner.close();
    }
  });
});
