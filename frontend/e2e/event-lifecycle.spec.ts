import type { Browser, Page } from '@playwright/test';
import { expect, test } from './support/test';
import {
  registerDisposableAccount,
  type DisposableAccount,
} from './support/accounts';
import { createWish } from './support/fixtures';
import {
  categoryChipName,
  eventCard,
  fillEventForm,
  isoDateIn,
  openCreateEventModal,
} from './support/app';

const CATEGORY = categoryChipName('E2E Testing');

type Owner = {
  account: DisposableAccount;
  page: Page;
  close: () => Promise<void>;
};

const signedInOwner = async (
  browser: Browser,
  baseURL: string,
  slug: string,
): Promise<Owner> => {
  const account = await registerDisposableAccount(baseURL, slug);
  const context = await browser.newContext({
    storageState: account.storageState,
  });
  const page = await context.newPage();

  return {
    account,
    page,
    close: async () => {
      await context.close();
      await account.api.dispose();
    },
  };
};

test.describe('event lifecycle', () => {
  test('creates a wish from the header and shows it on the profile', async ({
    browser,
    baseURL,
  }) => {
    const owner = await signedInOwner(browser, baseURL!, 'wish');
    const { page } = owner;
    const title = 'Rooftop stargazing';

    try {
      await page.goto('/profile');

      const dialog = await openCreateEventModal(page);

      await dialog.getByRole('button', { name: 'Wish', exact: true }).click();
      await expect(
        dialog.getByRole('heading', { name: 'Create a wish' }),
      ).toBeVisible();

      await fillEventForm(dialog, {
        category: CATEGORY,
        title,
        location: 'Somewhere with a clear sky',
        description: 'No telescope required.',
        timeframe: 'Sometime this summer',
      });

      await dialog.getByRole('button', { name: 'Share', exact: true }).click();
      await expect(dialog).toBeHidden();

      await page.getByRole('button', { name: 'Wishes', exact: true }).click();
      await expect(eventCard(page, title)).toBeVisible();
    } finally {
      await owner.close();
    }
  });

  test('creates a friends-only plan and keeps the chosen privacy', async ({
    browser,
    baseURL,
  }) => {
    const owner = await signedInOwner(browser, baseURL!, 'plan');
    const { page, account } = owner;
    const title = 'Friday pizza party';

    try {
      await page.goto('/profile');

      const dialog = await openCreateEventModal(page);

      await expect(
        dialog.getByRole('heading', { name: 'Create a plan' }),
      ).toBeVisible();

      await fillEventForm(dialog, {
        category: CATEGORY,
        title,
        location: 'The good pizza place',
        date: isoDateIn(14),
        time: '19:30',
        privacy: 'Friends only',
      });

      await dialog.getByRole('button', { name: 'Share', exact: true }).click();
      await expect(dialog).toBeHidden();
      await expect(eventCard(page, title)).toBeVisible();

      const response = await account.api.get(
        '/api/event/events?page=1&page_size=5',
      );
      const { results } = (await response.json()) as {
        results: { title: string; event_visibility: string }[];
      };

      expect(
        results.find(event => event.title === title)?.event_visibility,
      ).toBe('friends-only');
    } finally {
      await owner.close();
    }
  });

  test('keeps the submit button locked until the required fields are filled', async ({
    browser,
    baseURL,
  }) => {
    const owner = await signedInOwner(browser, baseURL!, 'required');
    const { page } = owner;

    try {
      await page.goto('/profile');

      const dialog = await openCreateEventModal(page);
      const submit = dialog.getByRole('button', { name: 'Share', exact: true });

      await expect(submit).toBeDisabled();

      await fillEventForm(dialog, { category: CATEGORY, title: 'Half filled' });
      await expect(submit).toBeDisabled();

      await fillEventForm(dialog, { location: 'Still no date' });
      await expect(submit).toBeDisabled();

      await fillEventForm(dialog, { date: isoDateIn(9), time: '20:00' });
      await expect(submit).toBeEnabled();
    } finally {
      await owner.close();
    }
  });

  test('edits an existing wish from the profile card', async ({
    browser,
    baseURL,
  }) => {
    const owner = await signedInOwner(browser, baseURL!, 'edit');
    const { page, account } = owner;

    try {
      await createWish(account.api, { title: 'Board games night' });

      await page.goto('/profile');
      await page.getByRole('button', { name: 'Wishes', exact: true }).click();

      const card = eventCard(page, 'Board games night');

      await expect(card).toBeVisible();
      await card.getByRole('button', { name: 'Edit' }).click();

      const dialog = page.getByRole('dialog').filter({
        has: page.getByRole('heading', { name: 'Edit a wish' }),
      });

      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('radio')).toHaveCount(0);

      await dialog.locator('#eventTitle').fill('Board games marathon');
      await dialog
        .getByRole('button', { name: 'Save changes', exact: true })
        .click();

      await expect(dialog).toBeHidden();
      await expect(eventCard(page, 'Board games marathon')).toBeVisible();
      await expect(eventCard(page, 'Board games night')).toHaveCount(0);
    } finally {
      await owner.close();
    }
  });

  test('converts a wish into a scheduled plan', async ({
    browser,
    baseURL,
  }) => {
    const owner = await signedInOwner(browser, baseURL!, 'planit');
    const { page, account } = owner;
    const title = 'Picnic in the park';

    try {
      await createWish(account.api, { title });

      await page.goto('/profile');
      await page.getByRole('button', { name: 'Wishes', exact: true }).click();

      await eventCard(page, title)
        .getByRole('button', { name: 'Plan it' })
        .click();

      const dialog = page.getByRole('dialog').filter({
        has: page.getByRole('heading', { name: 'Create a plan' }),
      });

      await expect(dialog).toBeVisible();
      await dialog.getByLabel('Event date').fill(isoDateIn(20));
      await dialog.getByLabel('Event time').fill('12:00');
      await dialog.getByRole('button', { name: 'Share', exact: true }).click();

      await expect(dialog).toBeHidden();

      await expect(eventCard(page, title)).toBeVisible();
      await expect(
        eventCard(page, title).getByRole('button', { name: 'Plan it' }),
      ).toHaveCount(0);

      await page.getByRole('button', { name: 'Wishes', exact: true }).click();
      await expect(eventCard(page, title)).toHaveCount(0);
    } finally {
      await owner.close();
    }
  });

  test('cancels a plan and files it under Archive', async ({
    browser,
    baseURL,
  }) => {
    const owner = await signedInOwner(browser, baseURL!, 'cancel');
    const { page } = owner;
    const title = 'Cancelled climbing trip';

    try {
      await page.goto('/profile');

      const dialog = await openCreateEventModal(page);

      await fillEventForm(dialog, {
        category: CATEGORY,
        title,
        location: 'The climbing gym',
        date: isoDateIn(11),
        time: '17:00',
      });
      await dialog.getByRole('button', { name: 'Share', exact: true }).click();
      await expect(dialog).toBeHidden();

      const card = eventCard(page, title);

      await expect(card).toBeVisible();

      const menuButton = card.getByRole('button', { name: 'Event options' });

      await menuButton.click();
      await card.getByRole('menuitem', { name: 'Cancel event' }).click();

      const confirm = page.getByRole('dialog', { name: 'Cancel this event?' });

      await expect(confirm).toBeVisible();
      await confirm.getByRole('button', { name: 'Cancel event' }).click();

      await expect(confirm).toBeHidden();
      await expect(eventCard(page, title)).toHaveCount(0);

      await page.getByRole('button', { name: 'Archive', exact: true }).click();
      await expect(eventCard(page, title)).toBeVisible();
      await expect(
        eventCard(page, title).getByRole('button', { name: 'View recap' }),
      ).toBeVisible();
    } finally {
      await owner.close();
    }
  });

  test('offers no cancel action on a wish, which cannot be archived', async ({
    browser,
    baseURL,
  }) => {
    const owner = await signedInOwner(browser, baseURL!, 'nocancel');
    const { page, account } = owner;

    try {
      await createWish(account.api, { title: 'Unarchivable wish' });

      await page.goto('/profile');
      await page.getByRole('button', { name: 'Wishes', exact: true }).click();

      const card = eventCard(page, 'Unarchivable wish');

      await card.getByRole('button', { name: 'Event options' }).click();

      await expect(
        card.getByRole('menuitem', { name: 'Share Event' }),
      ).toBeVisible();
      await expect(
        card.getByRole('menuitem', { name: 'Cancel event' }),
      ).toHaveCount(0);
    } finally {
      await owner.close();
    }
  });
});
