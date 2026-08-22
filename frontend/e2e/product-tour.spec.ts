import type { Browser, Page } from '@playwright/test';
import { expect, test } from './support/test';
import {
  registerDisposableAccount,
  type DisposableAccount,
} from './support/accounts';
import { befriend, createPlan } from './support/fixtures';

type Newcomer = {
  account: DisposableAccount;
  page: Page;
  close: () => Promise<void>;
};

const newcomer = async (
  browser: Browser,
  baseURL: string,
  slug: string,
  options: { withFeedContent?: boolean } = {},
): Promise<Newcomer> => {
  const account = await registerDisposableAccount(baseURL, slug, {
    skipFeedTour: false,
  });

  if (options.withFeedContent) {
    const friend = await registerDisposableAccount(baseURL, `${slug}pal`);

    await befriend(friend, account);
    await createPlan(friend.api, { title: `${slug} tour subject` });
    await friend.api.dispose();
  }

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

const welcomeCard = (page: Page) =>
  page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: /^Welcome, / }),
  });

test.describe('feed product tour', () => {
  test('greets a brand-new account on its first visit to the feed', async ({
    browser,
    baseURL,
  }) => {
    const visitor = await newcomer(browser, baseURL!, 'tourfirst');

    try {
      await visitor.page.goto('/feed');

      await expect(welcomeCard(visitor.page)).toBeVisible();
      await expect(
        visitor.page.getByRole('button', { name: 'Show me around' }),
      ).toBeVisible();
      await expect(
        visitor.page.getByRole('button', { name: 'Skip for now' }),
      ).toBeVisible();
    } finally {
      await visitor.close();
    }
  });

  test('stays away from an account that has already seen it', async ({
    browser,
    baseURL,
  }) => {
    const account = await registerDisposableAccount(baseURL!, 'tourseen');
    const context = await browser.newContext({
      storageState: account.storageState,
    });

    try {
      const page = await context.newPage();

      await page.goto('/feed');
      await page.getByRole('button', { name: /^Notifications/ }).waitFor();

      await expect(welcomeCard(page)).toHaveCount(0);
    } finally {
      await context.close();
      await account.api.dispose();
    }
  });

  test('steps forward and back with the arrow keys', async ({
    browser,
    baseURL,
  }) => {
    const visitor = await newcomer(browser, baseURL!, 'tourkeys', {
      withFeedContent: true,
    });
    const { page } = visitor;

    try {
      await page.goto('/feed');
      await expect(welcomeCard(page)).toBeVisible();

      await page.keyboard.press('ArrowRight');

      const counter = page.getByText(/^\d+ of \d+$/);

      await expect(counter).toHaveText('1 of 7');

      await page.keyboard.press('ArrowRight');
      await expect(counter).toHaveText('2 of 7');

      await page.keyboard.press('ArrowLeft');
      await expect(counter).toHaveText('1 of 7');

      await page.keyboard.press('ArrowLeft');
      await expect(welcomeCard(page)).toBeVisible();
    } finally {
      await visitor.close();
    }
  });

  test('keeps keyboard focus inside the tour card', async ({
    browser,
    baseURL,
  }) => {
    const visitor = await newcomer(browser, baseURL!, 'tourtrap');
    const { page } = visitor;

    try {
      await page.goto('/feed');

      const card = welcomeCard(page);

      await expect(card).toBeVisible();

      for (let press = 0; press < 6; press += 1) {
        await page.keyboard.press('Tab');
        await expect
          .poll(() =>
            card.evaluate(node => node.contains(document.activeElement)),
          )
          .toBe(true);
      }
    } finally {
      await visitor.close();
    }
  });

  test('remembers a dismissal, so the tour does not return', async ({
    browser,
    baseURL,
  }) => {
    const visitor = await newcomer(browser, baseURL!, 'tourskip');
    const { page, account } = visitor;

    try {
      await page.goto('/feed');
      await expect(welcomeCard(page)).toBeVisible();

      await page.getByRole('button', { name: 'Skip for now' }).click();
      await expect(welcomeCard(page)).toBeHidden();

      await page.reload();
      await page.getByRole('button', { name: /^Notifications/ }).waitFor();
      await expect(welcomeCard(page)).toHaveCount(0);

      const clean = await browser.newContext({
        storageState: account.storageState,
      });

      try {
        const freshPage = await clean.newPage();

        await freshPage.goto('/feed');
        await freshPage
          .getByRole('button', { name: /^Notifications/ })
          .waitFor();

        await expect(welcomeCard(freshPage)).toHaveCount(0);
      } finally {
        await clean.close();
      }
    } finally {
      await visitor.close();
    }
  });

  test('runs to the end and closes on the final card', async ({
    browser,
    baseURL,
  }) => {
    const visitor = await newcomer(browser, baseURL!, 'tourend', {
      withFeedContent: true,
    });
    const { page } = visitor;

    try {
      await page.goto('/feed');
      await expect(welcomeCard(page)).toBeVisible();

      await page.getByRole('button', { name: 'Show me around' }).click();

      for (let step = 0; step < 7; step += 1) {
        await page.getByRole('button', { name: 'Next' }).click();
      }

      await expect(
        page.getByRole('heading', { name: 'That’s the tour' }),
      ).toBeVisible();

      await page.getByRole('button', { name: 'Got it' }).click();
      await expect(
        page.getByRole('heading', { name: 'That’s the tour' }),
      ).toBeHidden();
    } finally {
      await visitor.close();
    }
  });

  test('stays shut at phone width, where it is not designed to run', async ({
    browser,
    baseURL,
  }) => {
    const account = await registerDisposableAccount(baseURL!, 'tourphone', {
      skipFeedTour: false,
    });
    const context = await browser.newContext({
      storageState: account.storageState,
      viewport: { width: 390, height: 844 },
    });

    try {
      const page = await context.newPage();

      await page.goto('/feed');
      await page.getByRole('button', { name: /^Notifications/ }).waitFor();

      await expect(welcomeCard(page)).toHaveCount(0);

      await page.setViewportSize({ width: 1280, height: 800 });
      await page.reload();

      await expect(welcomeCard(page)).toBeVisible();
    } finally {
      await context.close();
      await account.api.dispose();
    }
  });
});
