import { expect, test, expectNoA11yViolations } from './support/test';
import {
  disposableCredentials,
  registerDisposableAccount,
} from './support/accounts';
import {
  countVerificationCodes,
  waitForVerificationCode,
  waitForVerificationCodeAfter,
} from './support/mailbox';
import {
  ONBOARDING as onboarding,
  fillCode,
  onboardScreen,
  openSettingsMenu,
  startEmailOnboarding,
} from './support/app';
import { E2E_OWNER } from './support/constants';

test.describe('anonymous visitors', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('signs up with an emailed code and lands in the feed', async ({
    page,
  }) => {
    const { email, username } = disposableCredentials('signup');

    await page.goto('/onboard');
    await startEmailOnboarding(page, email);

    await expect(
      page.getByRole('heading', { name: 'Check your email' }),
    ).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();

    await fillCode(page, await waitForVerificationCode(email));
    await page.getByRole('button', { name: onboarding.submitCode }).click();

    const passwordField = page.locator('#password');

    await expect(
      page.getByRole('heading', { name: 'Create a password' }),
    ).toBeVisible();
    await passwordField.fill('SignupPass123!');
    await passwordField.blur();
    await page.getByRole('button', { name: onboarding.submitPassword }).click();

    await page.locator('#nickname').fill(username);
    await page.locator('#nickname').blur();
    await page.locator('#firstName').fill('Signup');
    await page.locator('#lastName').fill('Journey');
    await page.locator('#terms').check();

    const finish = page.getByRole('button', { name: onboarding.finish });

    await expect(finish).toBeEnabled();
    await finish.click();

    await expect(
      page.getByRole('heading', { name: new RegExp('Welcome aboard') }),
    ).toBeVisible();

    await page.getByRole('link', { name: onboarding.toFeed }).click();

    await expect(page).toHaveURL(/\/feed$/);
    await expect(
      page.getByRole('button', { name: /^Notifications/ }),
    ).toBeVisible();
  });

  test('signs an existing account back in', async ({ page, baseURL }) => {
    const account = await registerDisposableAccount(baseURL!, 'login');

    await account.api.dispose();

    await page.goto('/onboard');
    await startEmailOnboarding(page, account.email);

    await expect(
      page.getByRole('heading', { name: 'Enter your password' }),
    ).toBeVisible();

    await page.locator('#password').fill(account.password);
    await page
      .getByRole('button', { name: onboarding.logIn, exact: true })
      .click();

    await expect(page).toHaveURL(/\/feed$/);
  });

  test('sends anonymous visitors to onboarding, remembering where they wanted to go', async ({
    page,
  }) => {
    await page.goto('/friends');

    await expect(page).toHaveURL(
      `/onboard?next=${encodeURIComponent('/friends')}`,
    );
    await expect(
      page.getByRole('button', { name: onboarding.continueWithEmail }),
    ).toBeVisible();
  });

  test('answers unauthenticated API calls with 401 rather than a redirect', async ({
    request,
  }) => {
    const response = await request.get('/api/user/friendship/friends');

    expect(response.status()).toBe(401);
  });

  test('keeps onboarding free of new accessibility violations', async ({
    page,
  }) => {
    await page.goto('/onboard');
    await expectNoA11yViolations(page);
  });
});

test.describe('password recovery', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('recovers a forgotten password and trades it for a working session', async ({
    page,
    baseURL,
  }) => {
    test.slow();

    const account = await registerDisposableAccount(baseURL!, 'recover');

    await account.api.dispose();

    const newPassword = 'RecoveredPass456!';
    const mailedBefore = await countVerificationCodes(account.email);

    await page.goto('/onboard');
    await startEmailOnboarding(page, account.email);

    await expect(
      page.getByRole('heading', { name: 'Enter your password' }),
    ).toBeVisible();

    await page.getByRole('button', { name: onboarding.forgotPassword }).click();

    await expect(
      page.getByRole('heading', { name: 'Check your email' }),
    ).toBeVisible();
    await expect(
      page.getByText(`Enter the 6-digit code we sent to ${account.email}`),
    ).toBeVisible();

    const code = await waitForVerificationCodeAfter(
      account.email,
      mailedBefore,
    );

    await fillCode(page, code === '000000' ? '111111' : '000000');
    await page.getByRole('button', { name: onboarding.submitCode }).click();

    await expect(page.getByText('Invalid code')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Create new password' }),
    ).toHaveCount(0);

    await fillCode(page, code);
    await page.getByRole('button', { name: onboarding.submitCode }).click();

    const reset = onboardScreen(page, 'Create new password');

    await expect(reset).toBeVisible();
    await reset.locator('#password').fill(newPassword);
    await reset.locator('#password').blur();
    await reset.locator('#confirm-password').fill(newPassword);
    await reset.locator('#confirm-password').blur();
    await page.getByRole('button', { name: onboarding.updatePassword }).click();

    await expect(page.getByRole('heading', { name: 'Congrats' })).toBeVisible();
    await expect(page.getByText('Password updated successfully')).toBeVisible();

    await page.getByRole('link', { name: onboarding.toFeed }).click();

    await expect(page).toHaveURL(/\/feed$/);
    await expect(
      page.getByRole('button', { name: /^Notifications/ }),
    ).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/feed$/);

    const settings = await openSettingsMenu(page);

    await settings.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/onboard/);

    await startEmailOnboarding(page, account.email);

    await expect(
      page.getByRole('heading', { name: 'Enter your password' }),
    ).toBeVisible();

    await page.locator('#password').fill(account.password);
    await page
      .getByRole('button', { name: onboarding.logIn, exact: true })
      .click();

    await expect(page.getByText('Login failed')).toBeVisible();
    await expect(page).toHaveURL(/\/onboard/);

    await page.locator('#password').fill(newPassword);
    await page
      .getByRole('button', { name: onboarding.logIn, exact: true })
      .click();

    await expect(page).toHaveURL(/\/feed$/);
  });
});

test.describe('signed-in visitors', () => {
  test('redirects the marketing root to the feed', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/feed$/);
  });

  test('logs out from the settings menu and lands back on onboarding', async ({
    browser,
    baseURL,
  }) => {
    const account = await registerDisposableAccount(baseURL!, 'logout');
    const context = await browser.newContext({
      storageState: account.storageState,
    });

    try {
      const page = await context.newPage();

      await page.goto('/feed');

      const settings = await openSettingsMenu(page);

      await settings.getByRole('button', { name: 'Log out' }).click();

      await expect(page).toHaveURL(/\/onboard/);

      await page.goto('/feed');
      await expect(page).toHaveURL(/\/onboard\?next=/);
    } finally {
      await context.close();
      await account.api.dispose();
    }
  });

  test('keeps the seeded owner signed in across a reload', async ({ page }) => {
    await page.goto('/profile');

    await expect(
      page.getByRole('heading', { name: `@${E2E_OWNER.username}` }),
    ).toBeVisible();

    await page.reload();

    await expect(
      page.getByRole('heading', { name: `@${E2E_OWNER.username}` }),
    ).toBeVisible();
  });
});
