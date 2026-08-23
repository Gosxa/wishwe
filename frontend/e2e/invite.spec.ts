import type { Page } from '@playwright/test';
import { expect, test } from './support/test';
import {
  disposableCredentials,
  registerDisposableAccount,
  signInDisposableAccount,
} from './support/accounts';
import { createInvite } from './support/fixtures';
import { waitForVerificationCode } from './support/mailbox';
import {
  ONBOARDING,
  fillCode,
  onboardScreen,
  startEmailOnboarding,
} from './support/app';

const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;

const friendsCard = (page: Page, title: string) =>
  page.locator('section').filter({
    has: page.getByRole('heading', { name: title, exact: true }),
  });

test.describe('invitations', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('copies an invite link from the profile that opens the inviter’s landing page', async ({
    browser,
    baseURL,
    browserName,
    page,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'clipboard reads need Chromium permissions',
    );

    const inviter = await signInDisposableAccount(browser, baseURL!, 'inviter');

    try {
      await inviter.page
        .context()
        .grantPermissions(['clipboard-read', 'clipboard-write'], {
          origin: baseURL!,
        });
      await inviter.page.goto('/profile');

      const copy = inviter.page.getByRole('button', { name: 'Copy link!' });

      await expect(copy).toBeVisible();
      await copy.click();

      await expect(
        inviter.page.getByRole('button', { name: 'Copied!' }),
      ).toBeVisible();

      const copied = await inviter.page.evaluate(() =>
        navigator.clipboard.readText(),
      );
      const link = new URL(copied);

      expect(link.origin).toBe(baseURL);
      expect(link.pathname.replace('/invite/', '')).toMatch(UUID);

      await page.goto(copied);

      await expect(
        page.getByRole('heading', {
          name: `See what @${inviter.account.username} is planning next`,
        }),
      ).toBeVisible();
      await expect(page.getByRole('link', { name: 'Join' })).toBeVisible();
    } finally {
      await inviter.close();
    }
  });

  test('signs a brand-new visitor up through an invite and requests the inviter', async ({
    browser,
    baseURL,
    page,
  }) => {
    test.slow();

    const inviter = await signInDisposableAccount(browser, baseURL!, 'newhost');

    try {
      const token = await createInvite(inviter.account.api);
      const { email, username } = disposableCredentials('newjoiner');

      await page.goto(`/invite/${token}`);

      await expect(
        page.getByRole('heading', {
          name: `See what @${inviter.account.username} is planning next`,
        }),
      ).toBeVisible();

      await page.getByRole('link', { name: 'Join' }).click();

      await expect(page).toHaveURL(`/invite/${token}/join`);
      await expect(
        page.getByRole('heading', {
          name: `Join @${inviter.account.username} on wish.we`,
        }),
      ).toBeVisible();

      await startEmailOnboarding(page, email);

      await expect(
        page.getByRole('heading', { name: 'Check your email' }),
      ).toBeVisible();

      await fillCode(page, await waitForVerificationCode(email));
      await page.getByRole('button', { name: ONBOARDING.submitCode }).click();

      const password = onboardScreen(page, 'Create a password');

      await expect(password).toBeVisible();
      await password.locator('#password').fill('InvitePass123!');
      await password.locator('#password').blur();
      await page
        .getByRole('button', { name: ONBOARDING.submitPassword })
        .click();

      await page.locator('#nickname').fill(username);
      await page.locator('#nickname').blur();
      await page.locator('#firstName').fill('Invited');
      await page.locator('#lastName').fill('Joiner');
      await page.locator('#terms').check();

      const finish = page.getByRole('button', { name: ONBOARDING.finish });

      await expect(finish).toBeEnabled();
      await finish.click();

      await expect(
        page.getByRole('heading', { name: 'Request sent!' }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'Go to feed' }),
      ).toBeVisible();

      await inviter.page.goto('/friends');

      await expect(
        friendsCard(inviter.page, 'Requests').getByRole('link', {
          name: `@${username}`,
        }),
      ).toBeVisible();
    } finally {
      await inviter.close();
    }
  });

  test('logs existing accounts in through an invite and keeps the link reusable', async ({
    baseURL,
    page,
  }) => {
    test.slow();

    const inviter = await registerDisposableAccount(baseURL!, 'reusehost');
    const first = await registerDisposableAccount(baseURL!, 'firstguest');
    const second = await registerDisposableAccount(baseURL!, 'secondguest');

    try {
      const token = await createInvite(inviter.api);

      for (const guest of [first, second]) {
        await page.context().clearCookies();
        await page.goto(`/invite/${token}/join`);
        await startEmailOnboarding(page, guest.email);

        await expect(
          page.getByRole('heading', { name: 'Enter your password' }),
        ).toBeVisible();
        await expect(
          page.getByText(
            `Log in to your account to connect with @${inviter.username}`,
          ),
        ).toBeVisible();

        await page.locator('#password').fill(guest.password);
        await page
          .getByRole('button', { name: ONBOARDING.logInAndJoin })
          .click();

        await expect(
          page.getByRole('heading', { name: 'Request sent!' }),
        ).toBeVisible();
      }

      const incoming = await inviter.api.get('/api/user/friendship/incoming');

      expect(incoming.status()).toBe(200);

      const senders = ((await incoming.json()) as { sender: string }[]).map(
        request => request.sender,
      );

      expect(senders).toEqual(
        expect.arrayContaining([first.username, second.username]),
      );
    } finally {
      await second.api.dispose();
      await first.api.dispose();
      await inviter.api.dispose();
    }
  });

  test('reports a failure when the invite was already accepted by this account', async ({
    baseURL,
    page,
  }) => {
    const inviter = await registerDisposableAccount(baseURL!, 'repeathost');
    const guest = await registerDisposableAccount(baseURL!, 'repeatguest');

    try {
      const token = await createInvite(inviter.api);
      const accepted = await guest.api.post('/next_api/user/invite/use', {
        data: { token },
      });

      expect(accepted.ok(), 'the first acceptance should succeed').toBe(true);

      await page.goto(`/invite/${token}/join`);
      await startEmailOnboarding(page, guest.email);

      await expect(
        page.getByRole('heading', { name: 'Enter your password' }),
      ).toBeVisible();

      await page.locator('#password').fill(guest.password);
      await page.getByRole('button', { name: ONBOARDING.logInAndJoin }).click();

      await expect(
        page.getByText('Unable to accept invite. Please try again.'),
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Request sent!' }),
      ).toHaveCount(0);
    } finally {
      await guest.api.dispose();
      await inviter.api.dispose();
    }
  });

  test('falls back to a placeholder invite when the token is unknown', async ({
    page,
  }) => {
    const token = '00000000-0000-4000-8000-000000000000';

    await page.goto(`/invite/${token}`);

    await expect(
      page.getByRole('heading', {
        name: 'See what [@username] is planning next',
      }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Join' })).toHaveAttribute(
      'href',
      `/invite/${token}/join`,
    );
  });
});
