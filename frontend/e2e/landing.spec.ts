import type { Page } from '@playwright/test';
import { expect, test } from './support/test';
import { fillStable } from './support/app';

const SECTION_HEADINGS = [
  'See faces, not screens',
  'Organizing meetups made simple',
  "Why you'll love WishWe:",
  'Be the first to know when we launch 🚀',
  'Ready to add your first Wish?',
];

const waitlistForm = {
  name: 'Amy Lee',
  email: 'amy.waitlist@example.com',
  struggle: 'Deciding where to go',
} as const;

const fillWaitlist = async (page: Page, name: string, email: string) => {
  await fillStable(page.getByPlaceholder('Name', { exact: true }), name);
  await fillStable(page.getByPlaceholder('Email', { exact: true }), email);
};

test.describe('anonymous landing page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('serves the marketing page instead of sending visitors to onboarding', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page).toHaveURL('/');

    for (const heading of SECTION_HEADINGS) {
      await expect(
        page.getByRole('heading', { name: heading, exact: true }),
      ).toBeAttached();
    }
  });

  test('scrolls the hero calls to action to the sections they point at', async ({
    page,
  }) => {
    await page.goto('/');

    const waitlist = page.locator('#waitlist');
    const howItWorks = page.locator('#how-it-works');

    await expect(waitlist).not.toBeInViewport();

    await page.getByRole('link', { name: 'Get Early Access' }).first().click();

    await expect(waitlist).toBeInViewport();
    await expect(page).toHaveURL('/');

    await page.getByRole('link', { name: 'How it works?' }).click();

    await expect(howItWorks).toBeInViewport();
  });

  test('scrolls the closing call to action back to the waitlist', async ({
    page,
  }) => {
    await page.goto('/');

    const readyToWish = page.getByRole('link', { name: 'Get Early Access' });

    await readyToWish.last().scrollIntoViewIfNeeded();
    await readyToWish.last().click();

    await expect(page.locator('#waitlist')).toBeInViewport();
  });

  test('keeps an invalid signup on the page and explains both fields', async ({
    page,
  }) => {
    await page.goto('/');

    await fillWaitlist(page, 'Amy2', 'not-an-email');
    await page.getByRole('button', { name: 'Get Early Access' }).click();

    await expect(
      page.getByText(
        'Name can only contain letters, spaces, hyphens and apostrophes',
      ),
    ).toBeVisible();
    await expect(
      page.getByText('Please enter a valid email address'),
    ).toBeVisible();
    await expect(page).toHaveURL('/');
  });

  test('signs a visitor up through the waitlist and lands on the thank-you page', async ({
    page,
  }) => {
    await page.goto('/');

    await fillWaitlist(page, waitlistForm.name, waitlistForm.email);

    const survey = page.getByRole('button', { name: /meetup struggle/ });

    await survey.click();
    await page
      .getByRole('option', { name: waitlistForm.struggle, exact: true })
      .click();

    await expect(survey).toContainText(waitlistForm.struggle);

    await page.getByRole('button', { name: 'Get Early Access' }).click();

    await expect(page).toHaveURL('/thank-you');
    await expect(
      page.getByRole('heading', { name: "Cool, you're in!" }),
    ).toBeVisible();
  });

  test('navigates straight to the thank-you page when motion is reduced', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      reducedMotion: 'reduce',
      storageState: { cookies: [], origins: [] },
    });

    try {
      const page = await context.newPage();

      await page.goto('/');

      await fillWaitlist(page, waitlistForm.name, waitlistForm.email);
      await page.getByRole('button', { name: 'Get Early Access' }).click();

      await expect(page).toHaveURL('/thank-you');
    } finally {
      await context.close();
    }
  });

  test('serves the thank-you page directly and sends its call to action to onboarding', async ({
    page,
  }) => {
    await page.goto('/thank-you');

    await expect(
      page.getByRole('heading', { name: "Cool, you're in!" }),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Invite friends' }).click();

    await expect(page).toHaveURL(/\/onboard/);
  });
});
