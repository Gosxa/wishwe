import type { Browser, Page } from '@playwright/test';
import { expect, test, expectNoA11yViolations } from './support/test';
import {
  registerDisposableAccount,
  type DisposableAccount,
} from './support/accounts';
import { befriend, createPlan, createWish } from './support/fixtures';
import { eventCard, fillStable, movePointerAway } from './support/app';

type Reader = {
  account: DisposableAccount;
  friend: DisposableAccount;
  page: Page;
  close: () => Promise<void>;
};

const readerWithFriend = async (
  browser: Browser,
  baseURL: string,
  slug: string,
): Promise<Reader> => {
  const account = await registerDisposableAccount(baseURL, slug);
  const friend = await registerDisposableAccount(baseURL, `${slug}pal`);

  await befriend(friend, account);

  const context = await browser.newContext({
    storageState: account.storageState,
  });

  return {
    account,
    friend,
    page: await context.newPage(),
    close: async () => {
      await context.close();
      await account.api.dispose();
      await friend.api.dispose();
    },
  };
};

const toolbarFilter = (page: Page, label: string) =>
  page.getByRole('button', { name: label, exact: true });

const dropdown = (page: Page, label: 'Show:' | 'Sort:') =>
  page.getByRole('button').filter({ hasText: label });

const chooseFromDropdown = async (
  page: Page,
  label: 'Show:' | 'Sort:',
  option: string,
) => {
  await dropdown(page, label).click();
  await page.getByRole('button', { name: option, exact: true }).click();
};

test.describe('feed toolbar', () => {
  test('round-trips filter, reach and sort through the URL', async ({
    page,
  }) => {
    await page.goto('/feed');

    await expect(page).toHaveURL(/\/feed$/);

    await toolbarFilter(page, 'Plans').click();
    await expect(page).toHaveURL('/feed?filter=plans');

    await chooseFromDropdown(page, 'Show:', 'Only direct friends');
    await expect(page).toHaveURL('/feed?filter=plans&reach=direct');

    await chooseFromDropdown(page, 'Sort:', 'soonest first');
    await expect(page).toHaveURL(
      '/feed?filter=plans&reach=direct&sort=soonest',
    );

    await toolbarFilter(page, 'All').click();
    await expect(page).toHaveURL('/feed?reach=direct&sort=soonest');
  });

  test('restores the toolbar from the URL on a cold load', async ({ page }) => {
    await page.goto('/feed?filter=wishes&reach=direct&sort=heat');

    await expect(dropdown(page, 'Show:')).toContainText('Only direct friends');
    await expect(dropdown(page, 'Sort:')).toContainText('social heat');
  });

  test('drops the social-heat sort, which the All filter does not offer', async ({
    page,
  }) => {
    await page.goto('/feed?sort=heat');

    await expect(dropdown(page, 'Sort:')).toContainText('recently added');

    await toolbarFilter(page, 'Wishes').click();
    await expect(page).toHaveURL('/feed?filter=wishes');

    await dropdown(page, 'Sort:').click();
    await expect(
      page.getByRole('button', { name: 'social heat', exact: true }),
    ).toBeVisible();
  });

  test('falls back to defaults when the query string is nonsense', async ({
    page,
  }) => {
    await page.goto('/feed?filter=bogus&reach=elsewhere&sort=sideways');

    await expect(toolbarFilter(page, 'All')).toBeVisible();
    await expect(dropdown(page, 'Show:')).toContainText('All updates');
    await expect(dropdown(page, 'Sort:')).toContainText('recently added');
  });
});

test.describe('feed contents', () => {
  test('shows a friend’s plan and lets you join and leave it', async ({
    browser,
    baseURL,
  }) => {
    const reader = await readerWithFriend(browser, baseURL!, 'joiner');
    const title = 'Sunrise swim';

    try {
      await createPlan(reader.friend.api, { title });

      await reader.page.goto('/feed');

      const card = eventCard(reader.page, title);

      await expect(card).toBeVisible();

      await card.getByRole('button', { name: 'Join' }).click();

      await movePointerAway(reader.page);
      await expect(card.getByRole('button', { name: /Joined/ })).toBeVisible();

      await reader.page.reload();
      await expect(
        eventCard(reader.page, title).getByRole('button', { name: /Joined/ }),
      ).toBeVisible();

      await eventCard(reader.page, title)
        .getByRole('button', { name: /Joined/ })
        .click();

      const leaveDialog = reader.page.getByRole('dialog', {
        name: 'Leave this event?',
      });

      await expect(leaveDialog).toBeVisible();

      await leaveDialog.getByRole('button', { name: 'No, thanks' }).click();
      await expect(leaveDialog).toBeHidden();
      await movePointerAway(reader.page);
      await expect(
        eventCard(reader.page, title).getByRole('button', { name: /Joined/ }),
      ).toBeVisible();

      await eventCard(reader.page, title)
        .getByRole('button', { name: /Joined/ })
        .click();
      await leaveDialog
        .getByRole('button', { name: 'Leave', exact: true })
        .click();

      await expect(leaveDialog).toBeHidden();
      await expect(
        eventCard(reader.page, title).getByRole('button', { name: 'Join' }),
      ).toBeVisible();
    } finally {
      await reader.close();
    }
  });

  test('marks a friend’s wish as interesting', async ({ browser, baseURL }) => {
    const reader = await readerWithFriend(browser, baseURL!, 'curious');
    const title = 'Someday hot air balloon';

    try {
      await createWish(reader.friend.api, { title });

      await reader.page.goto('/feed?filter=wishes');

      const card = eventCard(reader.page, title);

      await expect(card).toBeVisible();
      await card.getByRole('button', { name: 'Interested' }).click();
      await movePointerAway(reader.page);

      await reader.page.reload();
      await expect(
        eventCard(reader.page, title).getByRole('button', {
          name: /Interested/,
        }),
      ).toBeVisible();
    } finally {
      await reader.close();
    }
  });

  test('narrows the feed with the header search', async ({
    browser,
    baseURL,
  }) => {
    const reader = await readerWithFriend(browser, baseURL!, 'searcher');

    try {
      await createPlan(reader.friend.api, { title: 'Kayak morning' });
      await createPlan(reader.friend.api, { title: 'Pottery evening' });

      await reader.page.goto('/feed');
      await expect(eventCard(reader.page, 'Kayak morning')).toBeVisible();
      await expect(eventCard(reader.page, 'Pottery evening')).toBeVisible();

      await fillStable(reader.page.getByPlaceholder('Search'), 'kayak');

      await expect(reader.page).toHaveURL('/feed?title=kayak');
      await expect(eventCard(reader.page, 'Kayak morning')).toBeVisible();
      await expect(eventCard(reader.page, 'Pottery evening')).toHaveCount(0);
    } finally {
      await reader.close();
    }
  });

  test('loads a second page when the list scrolls to the end', async ({
    browser,
    baseURL,
  }) => {
    const reader = await readerWithFriend(browser, baseURL!, 'scroller');

    try {
      for (let index = 1; index <= 8; index += 1) {
        await createPlan(reader.friend.api, {
          title: `Paged outing ${index}`,
          inDays: 10 + index,
        });
      }

      await reader.page.goto('/feed');

      const cards = reader.page.getByRole('article');

      await expect(cards).toHaveCount(5);

      await cards.last().scrollIntoViewIfNeeded();

      await expect(cards).toHaveCount(8);
    } finally {
      await reader.close();
    }
  });

  test('opens a deep-linked event that is not in the feed', async ({
    browser,
    baseURL,
  }) => {
    const reader = await readerWithFriend(browser, baseURL!, 'deeplink');
    const title = 'Deep linked dinner';

    try {
      const event = await createPlan(reader.friend.api, { title });

      await reader.page.goto(`/feed?filter=wishes&event=${event.id}`);

      await expect(
        reader.page.getByRole('heading', { name: title, exact: true }),
      ).toBeVisible();
    } finally {
      await reader.close();
    }
  });

  test('keeps the feed free of new accessibility violations', async ({
    browser,
    baseURL,
  }) => {
    const reader = await readerWithFriend(browser, baseURL!, 'axefeed');

    try {
      await createPlan(reader.friend.api, { title: 'Accessible outing' });

      await reader.page.goto('/feed');
      await expect(eventCard(reader.page, 'Accessible outing')).toBeVisible();

      await expectNoA11yViolations(reader.page);
    } finally {
      await reader.close();
    }
  });

  test('renders the feed at phone width @mobile', async ({
    browser,
    baseURL,
  }) => {
    const reader = await readerWithFriend(browser, baseURL!, 'phone');

    try {
      await createPlan(reader.friend.api, { title: 'Pocket sized plan' });

      await reader.page.goto('/feed');

      const card = eventCard(reader.page, 'Pocket sized plan');

      await expect(card).toBeVisible();

      const viewport = reader.page.viewportSize()!;
      const box = (await card.boundingBox())!;

      expect(box.width).toBeLessThanOrEqual(viewport.width);
      await expect
        .poll(() =>
          reader.page.evaluate(
            () =>
              document.documentElement.scrollWidth <=
              document.documentElement.clientWidth,
          ),
        )
        .toBe(true);
    } finally {
      await reader.close();
    }
  });
});
