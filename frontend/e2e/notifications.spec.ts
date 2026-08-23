import type { Page } from '@playwright/test';
import { expect, test, expectNoA11yViolations } from './support/test';
import {
  registerDisposableAccount,
  signInDisposableAccount as signIn,
} from './support/accounts';
import { befriend, createPlan } from './support/fixtures';

const LIST_ENDPOINT = /\/api\/notifications(\?|$)/;

const bell = (page: Page) =>
  page.getByRole('button', { name: /^Notifications/ });

const panel = (page: Page) =>
  page.getByRole('region', { name: 'Notifications' });

const openNotifications = async (page: Page) => {
  await bell(page).click();

  const menu = panel(page);

  await expect(menu).toBeVisible();

  return menu;
};

test.describe('notifications', () => {
  test('badges an unread friend request, marks it read, and opens the sender profile', async ({
    browser,
    baseURL,
  }) => {
    const me = await signIn(browser, baseURL!, 'notifme');
    const sender = await registerDisposableAccount(baseURL!, 'notifsender');

    try {
      const sent = await sender.api.post('/next_api/user/friendship/send', {
        data: { receiver_id: me.account.userId },
      });

      expect(sent.ok(), 'the friend request should be accepted').toBe(true);

      await me.page.goto('/feed');

      await expect(bell(me.page)).toHaveAccessibleName(
        'Notifications, 1 unread',
      );

      const menu = await openNotifications(me.page);
      const row = menu.getByRole('button', {
        name: new RegExp(sender.username),
      });

      await expect(row).toBeVisible();
      await expect(menu.getByText('No notifications yet.')).toHaveCount(0);

      await expect(bell(me.page)).toHaveAccessibleName('Notifications');

      await row.click();

      await expect(me.page).toHaveURL(`/user/${sender.username}`);
      await expect(panel(me.page)).toHaveCount(0);
    } finally {
      await sender.api.dispose();
      await me.close();
    }
  });

  test('keeps notifications read after a reload', async ({
    browser,
    baseURL,
  }) => {
    const me = await signIn(browser, baseURL!, 'notifread');
    const sender = await registerDisposableAccount(baseURL!, 'notifreader');

    try {
      await sender.api.post('/next_api/user/friendship/send', {
        data: { receiver_id: me.account.userId },
      });

      await me.page.goto('/feed');
      await expect(bell(me.page)).toHaveAccessibleName(
        'Notifications, 1 unread',
      );

      const readAll = me.page.waitForResponse(
        response =>
          response.url().includes('/next_api/notifications/read-all') &&
          response.request().method() === 'POST',
      );

      await openNotifications(me.page);
      await readAll;

      await me.page.reload();

      await expect(bell(me.page)).toHaveAccessibleName('Notifications');
      await expect(
        (await openNotifications(me.page)).getByRole('button', {
          name: new RegExp(sender.username),
        }),
      ).toBeVisible();
    } finally {
      await sender.api.dispose();
      await me.close();
    }
  });

  test('opens the event from a participation notification', async ({
    browser,
    baseURL,
  }) => {
    const host = await signIn(browser, baseURL!, 'notifhost');
    const guest = await registerDisposableAccount(baseURL!, 'notifguest');
    const title = 'Notification worthy picnic';

    try {
      await befriend(guest, host.account);

      const plan = await createPlan(host.account.api, { title });
      const joined = await guest.api.post(
        `/api/event/events/${plan.id}/join_plan/`,
      );

      expect(joined.ok(), 'the guest should be able to join the plan').toBe(
        true,
      );

      await host.page.goto('/feed');
      await expect(bell(host.page)).toHaveAccessibleName(/unread/);

      const menu = await openNotifications(host.page);

      await menu.getByRole('button', { name: new RegExp(title) }).click();

      await expect(
        host.page.getByRole('dialog', { name: title }),
      ).toBeVisible();
      await expect(panel(host.page)).toHaveCount(0);
    } finally {
      await guest.api.dispose();
      await host.close();
    }
  });

  test('shows a retryable error when the list request fails', async ({
    browser,
    baseURL,
  }) => {
    const me = await signIn(browser, baseURL!, 'notiferr');
    const sender = await registerDisposableAccount(baseURL!, 'notiferrsend');

    try {
      await sender.api.post('/next_api/user/friendship/send', {
        data: { receiver_id: me.account.userId },
      });

      await me.page.goto('/feed');
      await expect(bell(me.page)).toHaveAccessibleName(
        'Notifications, 1 unread',
      );

      let failures = 0;

      await me.page.route(LIST_ENDPOINT, async route => {
        failures += 1;
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Temporarily unavailable' }),
        });
      });

      const menu = await openNotifications(me.page);
      const alert = menu.getByRole('alert');

      await expect(alert).toContainText("We couldn't load notifications.");
      // A failed load must not look like an empty inbox.
      await expect(menu.getByText('No notifications yet.')).toHaveCount(0);
      expect(failures).toBeGreaterThan(0);

      await me.page.unroute(LIST_ENDPOINT);
      await alert.getByRole('button', { name: 'Try again' }).click();

      await expect(menu.getByRole('alert')).toHaveCount(0);
      await expect(
        menu.getByRole('button', { name: new RegExp(sender.username) }),
      ).toBeVisible();
    } finally {
      await sender.api.dispose();
      await me.close();
    }
  });

  test('reports an empty inbox for an account with no activity', async ({
    browser,
    baseURL,
  }) => {
    const me = await signIn(browser, baseURL!, 'notifquiet');

    try {
      await me.page.goto('/feed');
      await expect(bell(me.page)).toHaveAccessibleName('Notifications');

      const menu = await openNotifications(me.page);

      await expect(menu.getByText('No notifications yet.')).toBeVisible();
      await expect(menu.getByRole('alert')).toHaveCount(0);

      await expectNoA11yViolations(me.page, '#notifications-menu');
    } finally {
      await me.close();
    }
  });
});
