import { expect, test } from './support/test';
import {
  registerDisposableAccount,
  signInDisposableAccount,
} from './support/accounts';
import { befriend, createPlan, createWish } from './support/fixtures';
import { eventCard, movePointerAway } from './support/app';

test('Home, Friends and Activity follow the mobile layouts @mobile', async ({
  browser,
  baseURL,
}, testInfo) => {
  const me = await signInDisposableAccount(browser, baseURL!, 'mobile');
  const friend = await registerDisposableAccount(baseURL!, 'friend');
  const sender = await registerDisposableAccount(baseURL!, 'request');

  try {
    await befriend(friend, me.account);
    const plan = await createPlan(friend.api, {
      title: 'Board games night',
      description:
        'Bringing classic board games, snacks & warm vibes. Perfect way to spend a Friday night!',
      location: 'My place (m. Kontraktova)',
    });

    await createWish(friend.api, { title: 'Picnic in the garden' });
    await sender.api.post('/next_api/user/friendship/send', {
      data: { receiver_id: me.account.userId },
    });
    await me.page.setViewportSize({ width: 402, height: 786 });
    await me.page.goto('/feed');
    const nav = me.page.getByRole('navigation', { name: 'Primary' });
    const card = eventCard(me.page, plan.title);

    await expect(card).toBeVisible();
    const cover = (await card.getByAltText(plan.title).boundingBox())!;
    const heading = (await card
      .getByRole('heading', { name: plan.title })
      .boundingBox())!;

    expect(cover.width).toBeCloseTo(177, 0);
    expect(heading.x).toBeCloseTo(209, 0);
    expect(cover.height).toBeGreaterThanOrEqual(154);
    await me.page.screenshot({
      scale: 'css',
      path: testInfo.outputPath('home-mobile.png'),
    });

    await me.page.getByRole('button', { name: 'Sort', exact: true }).click();
    await expect(
      me.page.getByRole('radio', { name: 'Recently added' }),
    ).toBeChecked();
    await me.page.getByRole('radio', { name: 'Only direct friends' }).click();
    await expect(
      me.page.getByRole('radio', { name: 'Only direct friends' }),
    ).toBeChecked();
    await me.page.getByRole('radio', { name: 'Soonest first' }).click();
    await expect(
      me.page.getByRole('radio', { name: 'Soonest first' }),
    ).toBeChecked();
    await expect(me.page).toHaveURL(/reach=direct.*sort=soonest/);
    await me.page.screenshot({
      scale: 'css',
      path: testInfo.outputPath('sort-mobile.png'),
    });
    await me.page.keyboard.press('Escape');

    await card.getByRole('button', { name: plan.title }).click();
    const details = me.page.getByRole('dialog', { name: plan.title });

    await expect(details).toBeVisible();
    const detailsBox = (await details.boundingBox())!;

    expect(detailsBox.x).toBe(0);
    expect(detailsBox.width).toBe(402);
    await expect(
      details.getByRole('button', { name: 'Join', exact: true }),
    ).toBeVisible();
    await me.page.screenshot({
      scale: 'css',
      path: testInfo.outputPath('event-mobile.png'),
    });
    await details.getByRole('button', { name: 'Join', exact: true }).click();
    await movePointerAway(me.page);
    await expect(
      details.getByRole('button', { name: 'Joined', exact: true }),
    ).toBeVisible();
    await details.getByRole('button', { name: 'Close', exact: true }).click();

    await nav.getByRole('link', { name: 'Friends', exact: true }).click();
    await expect(
      me.page.getByRole('button', { name: 'Your friends', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      me.page.getByRole('link', { name: `@${friend.username}`, exact: true }),
    ).toBeVisible();
    await expect(
      me.page.getByRole('button', { name: 'Accept', exact: true }),
    ).toBeHidden();
    await me.page.screenshot({
      scale: 'css',
      path: testInfo.outputPath('friends-mobile.png'),
    });
    await me.page
      .getByRole('button', { name: 'Requests', exact: true })
      .click();
    await expect(
      me.page.getByRole('link', { name: `@${friend.username}`, exact: true }),
    ).toBeHidden();
    await expect(
      me.page.getByRole('link', { name: `@${sender.username}`, exact: true }),
    ).toBeVisible();
    await me.page.screenshot({
      scale: 'css',
      path: testInfo.outputPath('requests-mobile.png'),
    });
    await me.page.getByRole('button', { name: 'Accept', exact: true }).click();
    await expect(
      me.page.getByRole('button', { name: 'Accept', exact: true }),
    ).toHaveCount(0);
    await me.page
      .getByRole('button', { name: 'Your friends', exact: true })
      .click();
    await expect(
      me.page.getByRole('link', { name: `@${sender.username}`, exact: true }),
    ).toBeVisible();

    await nav.getByRole('link', { name: /^Activity/ }).click();
    await expect(
      me.page.getByRole('heading', { name: 'Activity', exact: true }),
    ).toBeVisible();
    const notification = me.page
      .getByRole('region', { name: 'Activity' })
      .getByRole('button', { name: new RegExp(sender.username) });

    await expect(notification).toBeVisible();
    await me.page.screenshot({
      scale: 'css',
      path: testInfo.outputPath('activity-mobile.png'),
    });
    await notification.click();
    await expect(me.page).toHaveURL(`/user/${sender.username}`);

    for (const width of [320, 375, 767]) {
      await me.page.setViewportSize({ width, height: 700 });
      await me.page.goto('/feed');
      await expect(card).toBeVisible();
      expect(
        await me.page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  } finally {
    await sender.api.dispose();
    await friend.api.dispose();
    await me.close();
  }
});
