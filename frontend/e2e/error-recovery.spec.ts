import type { Locator, Page, Route } from '@playwright/test';
import { expect, test } from './support/test';
import {
  registerDisposableAccount,
  signInDisposableAccount as signIn,
} from './support/accounts';
import { befriend, createPlan } from './support/fixtures';
import { eventCard } from './support/app';

const FEED_LIST = /\/api\/event\/events\?/;
const PROFILE_EVENTS = /\/api\/user\/users\/\d+\/events\?/;
const FRIENDS_LIST = /\/api\/user\/friendship\/friends\?/;

const serverError = (route: Route) =>
  route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ detail: 'Temporarily unavailable' }),
  });

const errorCard = (scope: Page | Locator, message: string) =>
  scope.getByRole('alert').filter({ hasText: message });

test.describe('load failures and recovery', () => {
  test('recovers the feed after a 5xx without ever showing the empty state', async ({
    browser,
    baseURL,
  }) => {
    const me = await signIn(browser, baseURL!, 'feed5xx');
    const buddy = await registerDisposableAccount(baseURL!, 'feed5xxpal');
    const title = 'Recovered rooftop dinner';

    try {
      await befriend(buddy, me.account);
      await createPlan(buddy.api, { title });

      await me.page.route(FEED_LIST, serverError);
      await me.page.goto('/feed');

      const alert = errorCard(me.page, 'Failed to load events');

      await expect(alert).toBeVisible();
      await expect(
        me.page.getByRole('heading', { name: 'Waiting for adventures?' }),
      ).toHaveCount(0);
      await expect(eventCard(me.page, title)).toHaveCount(0);

      await me.page.unroute(FEED_LIST);
      await alert.getByRole('button', { name: 'Try again' }).click();

      await expect(eventCard(me.page, title)).toBeVisible();
      await expect(alert).toHaveCount(0);
    } finally {
      await buddy.api.dispose();
      await me.close();
    }
  });

  test('recovers the owner profile feed after a 5xx', async ({
    browser,
    baseURL,
  }) => {
    const me = await signIn(browser, baseURL!, 'prof5xx');
    const title = 'Recovered solo hike';

    try {
      await createPlan(me.account.api, { title });

      await me.page.route(PROFILE_EVENTS, serverError);
      await me.page.goto('/profile');

      const alert = errorCard(me.page, 'Failed to load events');

      await expect(alert).toBeVisible();
      await expect(
        me.page.getByRole('heading', { name: 'No active plans' }),
      ).toHaveCount(0);

      await me.page.unroute(PROFILE_EVENTS);
      await alert.getByRole('button', { name: 'Try again' }).click();

      await expect(eventCard(me.page, title)).toBeVisible();
      await expect(alert).toHaveCount(0);
    } finally {
      await me.close();
    }
  });

  test('recovers another member’s profile feed after a 5xx', async ({
    browser,
    baseURL,
  }) => {
    const visitor = await signIn(browser, baseURL!, 'user5xx');
    const host = await registerDisposableAccount(baseURL!, 'user5xxhost');
    const title = 'Recovered board game night';

    try {
      await befriend(host, visitor.account);
      await createPlan(host.api, { title });

      await visitor.page.route(PROFILE_EVENTS, serverError);
      await visitor.page.goto(`/user/${host.username}`);

      const alert = errorCard(visitor.page, 'Failed to load events');

      await expect(alert).toBeVisible();
      await expect(
        visitor.page.getByRole('heading', { name: 'No plans yet' }),
      ).toHaveCount(0);
      await expect(
        visitor.page.getByRole('heading', { name: 'Friends-only profile' }),
      ).toHaveCount(0);

      await visitor.page.unroute(PROFILE_EVENTS);
      await alert.getByRole('button', { name: 'Try again' }).click();

      await expect(eventCard(visitor.page, title)).toBeVisible();
      await expect(alert).toHaveCount(0);
    } finally {
      await host.api.dispose();
      await visitor.close();
    }
  });

  test('recovers the friends page after a 5xx', async ({
    browser,
    baseURL,
  }) => {
    const me = await signIn(browser, baseURL!, 'friend5xx');
    const buddy = await registerDisposableAccount(baseURL!, 'friend5xxpal');

    try {
      await befriend(buddy, me.account);

      await me.page.route(FRIENDS_LIST, serverError);
      await me.page.goto('/friends');

      const friendsCard = me.page.locator('section').filter({
        has: me.page.getByRole('heading', { name: 'Your friends' }),
      });
      const alert = errorCard(friendsCard, 'Failed to load friends');

      await expect(alert).toBeVisible();
      await expect(
        me.page.getByText(/Your friend list is currently empty/),
      ).toHaveCount(0);
      await expect(
        me.page.getByRole('link', { name: `@${buddy.username}` }),
      ).toHaveCount(0);

      await me.page.unroute(FRIENDS_LIST);
      await alert.getByRole('button', { name: 'Try again' }).click();

      await expect(
        friendsCard.getByRole('link', { name: `@${buddy.username}` }),
      ).toBeVisible();
      await expect(alert).toHaveCount(0);
      await expect(errorCard(me.page, 'Failed to load friends')).toHaveCount(0);
    } finally {
      await buddy.api.dispose();
      await me.close();
    }
  });
});
