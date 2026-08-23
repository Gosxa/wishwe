import type { Page } from '@playwright/test';
import { expect, test, expectNoA11yViolations } from './support/test';
import {
  registerDisposableAccount,
  signInDisposableAccount as signIn,
} from './support/accounts';
import { befriend, createPlan } from './support/fixtures';
import { eventCard, fillStable, movePointerAway } from './support/app';

const friendsCard = (page: Page, title: string) =>
  page.locator('section').filter({
    has: page.getByRole('heading', { name: title, exact: true }),
  });

test.describe('friends', () => {
  test('finds a stranger by username and opens their profile from search', async ({
    browser,
    baseURL,
  }) => {
    const me = await signIn(browser, baseURL!, 'seeker');
    const stranger = await registerDisposableAccount(baseURL!, 'findme');

    try {
      await me.page.goto('/friends');
      await fillStable(
        me.page.getByPlaceholder('Search people'),
        stranger.username,
      );

      const morePeople = friendsCard(me.page, 'More people');

      await expect(
        morePeople.getByRole('link', { name: `@${stranger.username}` }),
      ).toBeVisible();

      await expect(
        morePeople.getByRole('button', { name: 'Add friend' }),
      ).toHaveCount(0);

      await morePeople
        .getByRole('link', { name: `@${stranger.username}` })
        .click();

      await expect(me.page).toHaveURL(`/user/${stranger.username}`);
      await expect(
        me.page.getByRole('button', { name: 'Add friend' }),
      ).toBeVisible();
    } finally {
      await stranger.api.dispose();
      await me.close();
    }
  });

  test('sends a request that the other account can accept', async ({
    browser,
    baseURL,
  }) => {
    const sender = await signIn(browser, baseURL!, 'sender');
    const receiver = await signIn(browser, baseURL!, 'receiver');

    try {
      await sender.page.goto(`/user/${receiver.account.username}`);
      await sender.page.getByRole('button', { name: 'Add friend' }).click();

      await movePointerAway(sender.page);
      await expect(
        sender.page.getByRole('button', { name: 'Requested', exact: true }),
      ).toBeVisible();

      await receiver.page.goto('/friends');

      const requests = friendsCard(receiver.page, 'Requests');

      await expect(
        requests.getByRole('link', { name: `@${sender.account.username}` }),
      ).toBeVisible();
      await requests.getByRole('button', { name: 'Accept' }).click();

      await expect(
        friendsCard(receiver.page, 'Your friends').getByRole('link', {
          name: `@${sender.account.username}`,
        }),
      ).toBeVisible();
      await expect(
        requests.getByRole('link', { name: `@${sender.account.username}` }),
      ).toHaveCount(0);

      await sender.page.reload();
      await expect(
        sender.page.getByRole('button', { name: 'You are friends' }),
      ).toBeVisible();
    } finally {
      await receiver.close();
      await sender.close();
    }
  });

  test('declines a request and leaves both sides unconnected', async ({
    browser,
    baseURL,
  }) => {
    const sender = await signIn(browser, baseURL!, 'declined');
    const receiver = await signIn(browser, baseURL!, 'decliner');

    try {
      await sender.page.goto(`/user/${receiver.account.username}`);
      await sender.page.getByRole('button', { name: 'Add friend' }).click();
      await movePointerAway(sender.page);
      await expect(
        sender.page.getByRole('button', { name: 'Requested', exact: true }),
      ).toBeVisible();

      await receiver.page.goto('/friends');

      const requests = friendsCard(receiver.page, 'Requests');

      await expect(
        requests.getByRole('link', { name: `@${sender.account.username}` }),
      ).toBeVisible();
      await requests.getByRole('button', { name: 'Decline' }).click();

      await expect(
        requests.getByRole('link', { name: `@${sender.account.username}` }),
      ).toHaveCount(0);
      await expect(
        friendsCard(receiver.page, 'Your friends').getByRole('link', {
          name: `@${sender.account.username}`,
        }),
      ).toHaveCount(0);
    } finally {
      await receiver.close();
      await sender.close();
    }
  });

  test('hides a profile’s events until the two accounts are friends', async ({
    browser,
    baseURL,
  }) => {
    const host = await registerDisposableAccount(baseURL!, 'host');
    const visitor = await signIn(browser, baseURL!, 'visitor');
    const title = 'Members only supper';

    try {
      await createPlan(host.api, { title });

      await visitor.page.goto(`/user/${host.username}`);

      await expect(
        visitor.page.getByRole('heading', { name: 'Friends-only profile' }),
      ).toBeVisible();
      await expect(eventCard(visitor.page, title)).toHaveCount(0);

      await befriend(host, visitor.account);
      await visitor.page.reload();

      await expect(
        visitor.page.getByRole('heading', { name: 'Friends-only profile' }),
      ).toHaveCount(0);
      await expect(eventCard(visitor.page, title)).toBeVisible();
    } finally {
      await host.api.dispose();
      await visitor.close();
    }
  });

  test('unfriends from the friends list after confirming', async ({
    browser,
    baseURL,
  }) => {
    const me = await signIn(browser, baseURL!, 'unfriender');
    const buddy = await registerDisposableAccount(baseURL!, 'exbuddy');

    try {
      await befriend(buddy, me.account);

      await me.page.goto('/friends');

      const list = friendsCard(me.page, 'Your friends');

      await expect(
        list.getByRole('link', { name: `@${buddy.username}` }),
      ).toBeVisible();

      await list
        .getByRole('button', { name: `Remove @${buddy.username}` })
        .click();

      const confirm = me.page.getByRole('dialog', {
        name: `Unfriend @${buddy.username}?`,
      });

      await expect(confirm).toBeVisible();
      await confirm.getByRole('button', { name: 'Unfriend' }).click();

      await expect(
        list.getByRole('link', { name: `@${buddy.username}` }),
      ).toHaveCount(0);

      await me.page.goto(`/user/${buddy.username}`);
      await expect(
        me.page.getByRole('button', { name: 'Add friend' }),
      ).toBeVisible();
    } finally {
      await buddy.api.dispose();
      await me.close();
    }
  });

  test('keeps the friends page free of new accessibility violations', async ({
    page,
  }) => {
    await page.goto('/friends');
    await expect(
      page.getByRole('heading', { name: 'Your friends' }),
    ).toBeVisible();

    await expectNoA11yViolations(page);
  });
});
