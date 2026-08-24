import type { Browser, Page } from '@playwright/test';
import { expect, test } from './support/test';
import {
  registerDisposableAccount,
  type DisposableAccount,
} from './support/accounts';

type Newcomer = {
  account: DisposableAccount;
  page: Page;
  close: () => Promise<void>;
};

const newcomer = async (
  browser: Browser,
  baseURL: string,
  slug: string,
): Promise<Newcomer> => {
  const account = await registerDisposableAccount(baseURL, slug, {
    skipFeedTour: false,
  });
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

const tourCard = (page: Page, heading: string | RegExp) =>
  page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: heading }),
  });

const welcomeCard = (page: Page) => tourCard(page, /^Welcome, /);

const createButton = (page: Page) => page.locator('[data-tour="create-event"]');

const runOnboarding = async (page: Page) => {
  await page.goto('/feed');
  await expect(welcomeCard(page)).toBeVisible();
  await page.getByRole('button', { name: 'Show me how' }).click();

  await expect(tourCard(page, 'Great! Tap the +')).toBeVisible();
  await createButton(page).click();

  await expect(tourCard(page, 'Plan or wish? 🤔')).toBeVisible();
  await page.getByRole('button', { name: 'Wish', exact: true }).click();

  const categoryStep = tourCard(page, /Let’s keep it simple/);

  await expect(categoryStep).toBeVisible();
  await page.locator('[data-tour^="category-"][aria-pressed]').first().click();

  for (const heading of [
    'Name it 📝',
    'Roughly where? 📍',
    'Add a little colour 💬',
    'When, roughly? ⏰',
  ]) {
    await expect(tourCard(page, heading)).toBeVisible();
    await page.getByRole('button', { name: 'Use this' }).click();
  }

  await expect(tourCard(page, 'That’s everything 🎉')).toBeVisible();
  await page.getByRole('button', { name: 'Share', exact: true }).click();
};

test.describe('feed onboarding tour', () => {
  test('greets a brand-new account on its first visit to the feed', async ({
    browser,
    baseURL,
  }) => {
    const visitor = await newcomer(browser, baseURL!, 'tourfirst');

    try {
      await visitor.page.goto('/feed');

      await expect(welcomeCard(visitor.page)).toBeVisible();
      await expect(
        visitor.page.getByRole('button', { name: 'Show me how' }),
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

  test('waits for the user instead of offering a next button', async ({
    browser,
    baseURL,
  }) => {
    const visitor = await newcomer(browser, baseURL!, 'tourwait');
    const { page } = visitor;

    try {
      await page.goto('/feed');
      await page.getByRole('button', { name: 'Show me how' }).click();

      const createStep = tourCard(page, 'Great! Tap the +');

      await expect(createStep).toBeVisible();
      await expect(createStep.getByText('Your turn')).toBeVisible();
      await expect(
        createStep.getByRole('button', { name: 'Next' }),
      ).toHaveCount(0);

      await createButton(page).click();
      await expect(tourCard(page, 'Plan or wish? 🤔')).toBeVisible();
    } finally {
      await visitor.close();
    }
  });

  test('blocks clicks outside the tour card and highlighted control', async ({
    browser,
    baseURL,
  }) => {
    const visitor = await newcomer(browser, baseURL!, 'tourback');
    const { page } = visitor;

    try {
      await page.goto('/feed');
      await page.getByRole('button', { name: 'Show me how' }).click();
      await createButton(page).click();

      await expect(tourCard(page, 'Plan or wish? 🤔')).toBeVisible();

      const close = page.getByRole('button', { name: 'Close', exact: true });
      const box = await close.boundingBox();

      if (!box) throw new Error('The create-modal close button is not visible');

      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

      await expect(tourCard(page, 'Plan or wish? 🤔')).toBeVisible();
      await expect(close).toBeVisible();
    } finally {
      await visitor.close();
    }
  });

  test('keeps next locked until the field it points at has content', async ({
    browser,
    baseURL,
  }) => {
    const visitor = await newcomer(browser, baseURL!, 'tourlock');
    const { page } = visitor;

    try {
      await page.goto('/feed');
      await page.getByRole('button', { name: 'Show me how' }).click();
      await createButton(page).click();
      await page.getByRole('button', { name: 'Wish', exact: true }).click();
      await page
        .locator('[data-tour^="category-"][aria-pressed]')
        .first()
        .click();

      const titleStep = tourCard(page, 'Name it 📝');

      await expect(titleStep).toBeVisible();
      await expect(
        titleStep.getByRole('button', { name: 'Next' }),
      ).toBeDisabled();

      await page.locator('#eventTitle').fill('Coffee?');

      await expect(
        titleStep.getByRole('button', { name: 'Next' }),
      ).toBeEnabled();
    } finally {
      await visitor.close();
    }
  });

  test('quick-fills the form and ends on the share sheet', async ({
    browser,
    baseURL,
  }) => {
    const visitor = await newcomer(browser, baseURL!, 'tourfill');
    const { page } = visitor;

    try {
      await runOnboarding(page);

      await expect(tourCard(page, /Now bring your people/)).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Copy link' }),
      ).toBeVisible();

      await page.getByRole('button', { name: 'Got it' }).click();

      await expect(tourCard(page, 'You’re all set! ✅')).toBeVisible();

      await page.getByRole('button', { name: 'Finish' }).click();

      await expect(tourCard(page, 'You’re all set! ✅')).toBeHidden();
      await expect(
        page.getByRole('heading', { name: 'Share this wish' }),
      ).toBeVisible();

      await page.getByRole('button', { name: 'Close share dialog' }).click();
      await page.reload();
      await page.getByRole('button', { name: /^Notifications/ }).waitFor();

      await expect(welcomeCard(page)).toHaveCount(0);
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
