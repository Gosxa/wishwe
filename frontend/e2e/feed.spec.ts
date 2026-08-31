import type { Browser, Page } from '@playwright/test';
import type { BackendEvent, Paginated } from '@shared/client_api/event';
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
  test('falls back from a missing cover without stretching the media', async ({
    browser,
    baseURL,
  }) => {
    const reader = await readerWithFriend(browser, baseURL!, 'missingcover');
    const title = 'Picnic with a deleted cover';
    const deletedCover = '/media/deleted-event-cover.jpg';
    const longDescription = Array(8)
      .fill('This longer description keeps the event details readable.')
      .join(' ');

    try {
      const event = await createPlan(reader.friend.api, { title });

      await reader.page.route('**/api/event/events?**', async route => {
        const response = await route.fetch();
        const page = (await response.json()) as Paginated<BackendEvent>;

        await route.fulfill({
          response,
          json: {
            ...page,
            results: page.results.map(item =>
              String(item.id) === event.id
                ? {
                    ...item,
                    cover_image: deletedCover,
                    description: longDescription,
                  }
                : item,
            ),
          },
        });
      });
      await reader.page.route(`**${deletedCover}`, route =>
        route.fulfill({ status: 404, body: '' }),
      );

      const missingCoverRequest = reader.page.waitForRequest(
        `**${deletedCover}`,
      );

      await reader.page.goto('/feed');
      await missingCoverRequest;

      const card = eventCard(reader.page, title);
      const cover = card.getByRole('img', { name: title });

      await expect(cover).toHaveAttribute('src', '/bg-gradient-noise.webp');

      const media = cover.locator('..');
      const mediaBox = await media.boundingBox();
      const cardBox = await card.boundingBox();

      expect(mediaBox).not.toBeNull();
      expect(cardBox).not.toBeNull();
      expect(mediaBox!.width / mediaBox!.height).toBeCloseTo(16 / 9, 1);
      expect(mediaBox!.height).toBeLessThan(cardBox!.height);
    } finally {
      await reader.close();
    }
  });

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

  test('round-trips event details through the URL and nested participant actions', async ({
    browser,
    baseURL,
  }) => {
    const reader = await readerWithFriend(browser, baseURL!, 'details');
    const title = 'Moonlight paddle';

    try {
      const event = await createPlan(reader.friend.api, { title });

      await reader.page.goto('/feed');

      const card = eventCard(reader.page, title);

      await expect(card).toBeVisible();
      await card.getByRole('button', { name: title, exact: true }).click();

      await expect(reader.page).toHaveURL(`/feed?event=${event.id}`);

      let details = reader.page.getByRole('dialog', { name: title });

      await expect(details).toBeVisible();
      await details.getByRole('button', { name: '1/8' }).click();

      let participants = reader.page.getByRole('dialog', {
        name: "Who's going",
      });

      await expect(participants).toBeVisible();
      await expect(
        participants.getByRole('link', {
          name: `@${reader.friend.username}`,
        }),
      ).toBeVisible();
      await participants.getByRole('button', { name: 'Close' }).click();

      await expect(participants).toBeHidden();
      await expect(details).toBeVisible();

      await details.getByRole('button', { name: 'Join', exact: true }).click();

      await movePointerAway(reader.page);
      await expect(
        details.getByRole('button', { name: /Joined/ }),
      ).toBeVisible();
      await expect(details.getByRole('button', { name: '2/8' })).toBeVisible();

      await details.getByRole('button', { name: '2/8' }).click();
      participants = reader.page.getByRole('dialog', { name: "Who's going" });

      await expect(
        participants.getByRole('link', { name: `@${reader.account.username}` }),
      ).toBeVisible();
      await participants.getByRole('button', { name: 'Close' }).click();
      await movePointerAway(reader.page);

      await reader.page.reload();

      details = reader.page.getByRole('dialog', { name: title });
      await expect(details).toBeVisible();
      await expect(reader.page).toHaveURL(`/feed?event=${event.id}`);
      await expect(
        details.getByRole('button', { name: /Joined/ }),
      ).toBeVisible();

      await details.getByRole('button', { name: /Joined/ }).click();

      const leaveDialog = reader.page.getByRole('dialog', {
        name: 'Leave this event?',
      });

      await leaveDialog
        .getByRole('button', { name: 'Leave', exact: true })
        .click();

      await expect(leaveDialog).toBeHidden();
      await expect(
        details.getByRole('button', { name: 'Join', exact: true }),
      ).toBeVisible();
      await expect(details.getByRole('button', { name: '1/8' })).toBeVisible();

      await details.getByRole('button', { name: 'Close' }).click();

      await expect(details).toBeHidden();
      await expect(reader.page).toHaveURL('/feed');
    } finally {
      await reader.close();
    }
  });

  test('preserves participation state and shows feedback when joining fails', async ({
    browser,
    baseURL,
  }) => {
    const reader = await readerWithFriend(browser, baseURL!, 'joinfail');
    const title = 'Stormy picnic';

    try {
      const event = await createPlan(reader.friend.api, { title });
      const joinEndpoint = `**/api/event/events/${event.id}/join_plan/`;

      await reader.page.route(joinEndpoint, route =>
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Temporarily unavailable.' }),
        }),
      );
      await reader.page.goto('/feed');

      const card = eventCard(reader.page, title);

      await card.getByRole('button', { name: 'Join', exact: true }).click();

      await expect(
        reader.page.getByRole('alert').filter({
          hasText: 'Could not join this event. Please try again.',
        }),
      ).toBeVisible();
      await expect(
        card.getByRole('button', { name: 'Join', exact: true }),
      ).toBeEnabled();

      await reader.page.unroute(joinEndpoint);
      await card.getByRole('button', { name: 'Join', exact: true }).click();
      await movePointerAway(reader.page);

      await expect(card.getByRole('button', { name: /Joined/ })).toBeVisible();
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

  test('explains a forbidden deep link without exposing the event', async ({
    browser,
    baseURL,
  }) => {
    const viewer = await registerDisposableAccount(baseURL!, 'privateviewer');
    const host = await registerDisposableAccount(baseURL!, 'privatehost');
    const context = await browser.newContext({
      storageState: viewer.storageState,
    });

    try {
      const event = await createPlan(host.api, {
        title: 'Friends only dinner',
        visibility: 'friends-only',
      });
      const page = await context.newPage();

      await page.goto(`/feed?event=${event.id}`);

      await expect(
        page.getByRole('status').filter({
          hasText: 'This event is only visible to the host’s friends.',
        }),
      ).toBeVisible();
      await expect(
        page.getByRole('heading', {
          name: 'Friends only dinner',
          exact: true,
        }),
      ).toHaveCount(0);
    } finally {
      await context.close();
      await viewer.api.dispose();
      await host.api.dispose();
    }
  });

  test('dismisses a missing deep link and removes it from the URL', async ({
    browser,
    baseURL,
  }) => {
    const reader = await readerWithFriend(browser, baseURL!, 'missinglink');

    try {
      await reader.page.goto('/feed?event=999999999');

      const unavailable = reader.page.getByRole('alertdialog');

      await expect(unavailable).toContainText(
        'This event isn’t available right now.',
      );
      await unavailable.getByRole('button', { name: 'Dismiss' }).click();

      await expect(unavailable).toBeHidden();
      await expect(reader.page).toHaveURL('/feed');
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
    let releaseFeedRequest = () => {};

    try {
      await createPlan(reader.friend.api, { title: 'Pocket sized plan' });

      await reader.page.setViewportSize({ width: 320, height: 860 });
      await reader.page.goto('/friends');

      const feedRequestGate = new Promise<void>(resolve => {
        releaseFeedRequest = resolve;
      });

      await reader.page.route('**/api/event/events?**', async route => {
        await feedRequestGate;
        await route.continue();
      });

      const primaryNav = reader.page.getByRole('navigation', {
        name: 'Primary',
      });

      await primaryNav.locator('a[href="/feed"]').click();
      await expect(reader.page).toHaveURL('/feed');
      await expect(
        reader.page.getByRole('status', { name: 'Loading' }),
      ).toBeVisible();
      expect(
        await reader.page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      ).toBe(true);

      releaseFeedRequest();

      const card = eventCard(reader.page, 'Pocket sized plan');

      await expect(card).toBeVisible();

      const viewport = reader.page.viewportSize()!;
      const box = (await card.boundingBox())!;

      expect(box.width).toBeLessThanOrEqual(viewport.width);

      const bottomControls = [
        primaryNav.locator('a[href="/feed"]'),
        primaryNav.locator('a[href="/friends"]'),
        reader.page.locator('[data-tour="create-event"]'),
        reader.page.getByRole('button', { name: /^Notifications/ }),
        primaryNav.locator('a[href="/profile"]'),
      ];
      const controlBoxes = await Promise.all(
        bottomControls.map(control => control.boundingBox()),
      );

      for (const controlBox of controlBoxes) {
        expect(controlBox).not.toBeNull();
        expect(controlBox!.x).toBeGreaterThanOrEqual(0);
        expect(controlBox!.x + controlBox!.width).toBeLessThanOrEqual(
          viewport.width,
        );
      }

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
      releaseFeedRequest();
      await reader.close();
    }
  });
});
