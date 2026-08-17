import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import {
  expect,
  test as base,
  type Locator,
  type Page,
} from '@playwright/test';
import { E2E_EVENT_TITLE } from './support/constants';

type AutoFixtures = {
  browserErrors: void;
};

const test = base.extend<AutoFixtures>({
  browserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];

      page.on('pageerror', error => errors.push(error.message));
      await use();

      expect(errors, 'uncaught errors were emitted by the page').toEqual([]);
    },
    { auto: true },
  ],
});

const shareEndpoint = '**/next_api/event/*/share';
const socialNames = ['Telegram', 'WhatsApp', 'X', 'Facebook'] as const;

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(promiseResolve => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
};

const eventCard = (page: Page) =>
  page.getByRole('article').filter({
    has: page.getByRole('heading', { name: E2E_EVENT_TITLE }),
  });

const openShareDialog = async (page: Page, card = eventCard(page)) => {
  const menuButton = card.getByRole('button', { name: 'Event options' });

  await menuButton.click();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  await card.getByRole('menuitem', { name: 'Share Event' }).click();

  const dialog = page.getByRole('dialog', { name: 'Share this plan' });

  await expect(dialog).toBeVisible();

  return { dialog, menuButton };
};

const openOwnerProfile = async (page: Page) => {
  await page.goto('/profile');

  const card = eventCard(page);

  await expect(card).toBeVisible();

  return card;
};

const linkUrl = async (link: Locator) => {
  const href = await link.getAttribute('href');

  expect(href).not.toBeNull();

  return new URL(href!);
};

const pngSize = async (filePath: string) => {
  const png = await readFile(filePath);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  expect(png.subarray(0, signature.length)).toEqual(signature);

  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
};

const expectGeneratedImage = async (
  image: Locator,
  dimensions: { width: number; height: number },
) => {
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate((node: HTMLImageElement) => ({
        width: node.naturalWidth,
        height: node.naturalHeight,
      })),
    )
    .toEqual(dimensions);
};

const captureWindowOpen = async (page: Page) => {
  await page.evaluate(() => {
    const state = window as typeof window & {
      __wishweOpenArgs?: Array<string | undefined>;
    };

    state.__wishweOpenArgs = undefined;
    window.open = (url, target, features) => {
      state.__wishweOpenArgs = [String(url), target, features];

      return null;
    };
  });
};

test.describe('Share Event modal', () => {
  test('creates a private owner link and opens a valid anonymous share page', async ({
    browser,
    browserName,
    context,
    page,
  }) => {
    const card = await openOwnerProfile(page);
    const requestStarted = deferred();
    const releaseRequest = deferred();
    let shareRequests = 0;

    await page.route(shareEndpoint, async route => {
      shareRequests += 1;
      requestStarted.resolve();
      await releaseRequest.promise;
      await route.continue();
    });

    const shareResponsePromise = page.waitForResponse(
      response =>
        response.request().method() === 'POST' &&
        /\/next_api\/event\/[^/]+\/share$/.test(response.url()),
    );
    const { dialog } = await openShareDialog(page, card);

    await requestStarted.promise;

    for (const name of socialNames) {
      const link = dialog.getByRole('link', { name });

      await expect(link).toHaveAttribute('href', '#');
      await expect(link).toHaveAttribute('aria-disabled', 'true');
    }

    const nextFormat = dialog.getByRole('button', {
      name: 'Next share format',
    });

    await nextFormat.focus();
    await expect(nextFormat).toBeFocused();

    releaseRequest.resolve();

    const shareResponse = await shareResponsePromise;

    expect(shareResponse.status()).toBe(200);

    const payload = (await shareResponse.json()) as { share_url: string };
    const origin = new URL(page.url()).origin;
    const sharePath = new URL(payload.share_url).pathname;
    const publicShareLink = `${origin}${sharePath}`;

    await expect(nextFormat).toBeFocused();
    expect(shareRequests).toBe(1);

    for (const name of socialNames) {
      await expect(dialog.getByRole('link', { name })).toHaveAttribute(
        'aria-disabled',
        'false',
      );
    }

    const telegram = await linkUrl(
      dialog.getByRole('link', { name: 'Telegram' }),
    );
    const whatsapp = await linkUrl(
      dialog.getByRole('link', { name: 'WhatsApp' }),
    );
    const x = await linkUrl(dialog.getByRole('link', { name: 'X' }));
    const facebook = await linkUrl(
      dialog.getByRole('link', { name: 'Facebook' }),
    );

    expect(telegram.origin).toBe('https://t.me');
    expect(telegram.searchParams.get('url')).toBe(publicShareLink);
    expect(telegram.searchParams.get('text')).toBe(E2E_EVENT_TITLE);
    expect(whatsapp.origin).toBe('https://wa.me');
    expect(whatsapp.searchParams.get('text')).toBe(
      `${E2E_EVENT_TITLE} ${publicShareLink}`,
    );
    expect(x.origin).toBe('https://x.com');
    expect(x.searchParams.get('url')).toBe(publicShareLink);
    expect(x.searchParams.get('text')).toBe(E2E_EVENT_TITLE);
    expect(facebook.searchParams.get('u')).toBe(publicShareLink);

    await expectGeneratedImage(
      dialog.getByRole('img', {
        name: `Poster share image for ${E2E_EVENT_TITLE}`,
      }),
      { width: 1200, height: 630 },
    );
    await expect
      .poll(() =>
        dialog.evaluate(
          node =>
            node
              .getAnimations({ subtree: true })
              .filter(animation => animation.playState === 'running').length,
        ),
      )
      .toBe(0);

    const accessibility = await new AxeBuilder({ page })
      .include('[role="dialog"][aria-labelledby="shareEventTitle"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibility.violations).toEqual([]);

    if (browserName === 'chromium') {
      await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
        origin,
      });
      await dialog.getByRole('button', { name: 'Copy link' }).click();
      await expect(
        dialog.getByRole('button', { name: 'Link copied!' }),
      ).toBeVisible();
      await expect(page.getByRole('status')).toHaveText('Link Copied!');
      await expect
        .poll(() => page.evaluate(() => navigator.clipboard.readText()))
        .toBe(publicShareLink);
    }

    await captureWindowOpen(page);
    await dialog.getByRole('link', { name: 'Telegram' }).click();

    const openArgs = await page.evaluate(
      () =>
        (
          window as typeof window & {
            __wishweOpenArgs?: Array<string | undefined>;
          }
        ).__wishweOpenArgs,
    );

    expect(openArgs).toEqual([
      telegram.toString(),
      'wishwe-telegram-share',
      'popup,width=620,height=640,noopener,noreferrer',
    ]);

    const anonymousContext = await browser.newContext({
      baseURL: origin,
      storageState: { cookies: [], origins: [] },
    });

    try {
      const anonymousPage = await anonymousContext.newPage();

      expect(await anonymousContext.cookies()).toEqual([]);
      await anonymousPage.goto(publicShareLink);
      await expect(
        anonymousPage.getByRole('dialog', { name: E2E_EVENT_TITLE }),
      ).toBeVisible();
      await expect(
        anonymousPage.getByRole('link', { name: 'Login to your account' }),
      ).toHaveAttribute(
        'href',
        `/onboard?next=${encodeURIComponent(sharePath)}`,
      );
    } finally {
      await anonymousContext.close();
    }
  });

  test('renders every canvas format, persists the choice, and downloads a valid PNG', async ({
    page,
  }) => {
    const card = await openOwnerProfile(page);
    let { dialog } = await openShareDialog(page, card);

    await expectGeneratedImage(
      dialog.getByRole('img', {
        name: `Poster share image for ${E2E_EVENT_TITLE}`,
      }),
      { width: 1200, height: 630 },
    );
    await expect(dialog.getByRole('tab', { name: 'Poster' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await dialog.getByRole('button', { name: 'Next share format' }).click();
    await expectGeneratedImage(
      dialog.getByRole('img', {
        name: `Card share image for ${E2E_EVENT_TITLE}`,
      }),
      { width: 1200, height: 630 },
    );

    await page.keyboard.press('ArrowRight');
    await expectGeneratedImage(
      dialog.getByRole('img', {
        name: `Story share image for ${E2E_EVENT_TITLE}`,
      }),
      { width: 1080, height: 1920 },
    );
    await expect(dialog.getByRole('tab', { name: 'Story' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem('wishwe-share-format'),
        ),
      )
      .toBe('story');

    await dialog.getByRole('button', { name: 'Close share dialog' }).click();
    await expect(dialog).toBeHidden();

    ({ dialog } = await openShareDialog(page, card));
    await expect(dialog.getByRole('tab', { name: 'Story' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expectGeneratedImage(
      dialog.getByRole('img', {
        name: `Story share image for ${E2E_EVENT_TITLE}`,
      }),
      { width: 1080, height: 1920 },
    );

    const downloadPromise = page.waitForEvent('download');

    await dialog.getByRole('link', { name: 'Download Story image' }).click();

    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe(
      'wishwe-e2e-share-flow-plan-story.png',
    );

    const filePath = await download.path();

    expect(filePath).not.toBeNull();
    expect(await pngSize(filePath!)).toEqual({ width: 1080, height: 1920 });
  });

  test('traps focus, locks scroll, and only closes from the explicit control', async ({
    page,
  }) => {
    const card = await openOwnerProfile(page);
    const initialOverflow = await page.evaluate(
      () => document.body.style.overflow,
    );
    const { dialog, menuButton } = await openShareDialog(page, card);
    const closeButton = dialog.getByRole('button', {
      name: 'Close share dialog',
    });

    await expect(closeButton).toBeFocused();
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .toBe('hidden');

    await expectGeneratedImage(
      dialog.getByRole('img', {
        name: `Poster share image for ${E2E_EVENT_TITLE}`,
      }),
      { width: 1200, height: 630 },
    );
    await expect
      .poll(() =>
        dialog.evaluate(
          node =>
            node
              .getAnimations()
              .filter(animation => animation.playState === 'running').length,
        ),
      )
      .toBe(0);

    const backdrop = dialog.locator('..');

    await backdrop.click({ position: { x: 2, y: 2 } });
    await expect(dialog).toBeVisible();
    await expect
      .poll(() =>
        dialog.evaluate(
          node =>
            node
              .getAnimations()
              .filter(animation => animation.playState === 'running').length,
        ),
      )
      .toBeGreaterThan(0);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();

    await closeButton.focus();
    await page.keyboard.press('Shift+Tab');
    expect(
      await dialog.evaluate(node => {
        const focusable = Array.from(
          node.querySelectorAll<HTMLElement>(
            'a[href]:not([aria-disabled="true"]), button:not(:disabled)',
          ),
        );

        return document.activeElement === focusable.at(-1);
      }),
    ).toBe(true);

    await page.keyboard.press('Tab');
    await expect(closeButton).toBeFocused();

    await closeButton.click();
    await expect(dialog).toBeHidden();
    await expect(menuButton).toBeFocused();
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .toBe(initialOverflow);
  });

  test('falls back to the feed deep link when owner link creation fails', async ({
    page,
  }) => {
    const card = await openOwnerProfile(page);
    let eventId = '';
    let shareRequests = 0;

    await page.route(shareEndpoint, async route => {
      shareRequests += 1;
      eventId = new URL(route.request().url()).pathname.split('/').at(-2) ?? '';
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Temporarily unavailable' }),
      });
    });

    const { dialog } = await openShareDialog(page, card);
    const telegram = dialog.getByRole('link', { name: 'Telegram' });

    await expect(telegram).toHaveAttribute('aria-disabled', 'false');

    const telegramUrl = await linkUrl(telegram);
    const expectedFallback = `${new URL(page.url()).origin}/feed?event=${eventId}`;

    expect(eventId).not.toBe('');
    expect(shareRequests).toBe(1);
    expect(telegramUrl.searchParams.get('url')).toBe(expectedFallback);
    await expect(
      dialog.getByRole('button', { name: 'Copy link' }),
    ).toBeEnabled();
  });

  test('switches to PNG download when the image clipboard rejects the write', async ({
    browserName,
    page,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'ClipboardItem support is browser-specific',
    );

    await page.addInitScript(() => {
      if (!navigator.clipboard) return;

      Object.defineProperty(navigator.clipboard, 'write', {
        configurable: true,
        value: () =>
          Promise.reject(new DOMException('Denied', 'NotAllowedError')),
      });
    });

    const card = await openOwnerProfile(page);
    const { dialog } = await openShareDialog(page, card);
    const copyImage = dialog.getByRole('button', { name: 'Copy image' });

    await expectGeneratedImage(
      dialog.getByRole('img', {
        name: `Poster share image for ${E2E_EVENT_TITLE}`,
      }),
      { width: 1200, height: 630 },
    );
    await expect(copyImage).toBeEnabled();
    await copyImage.click();

    await expect(
      dialog.getByText(
        'This browser can’t copy images — the PNG downloads instead.',
      ),
    ).toBeVisible();

    const downloadPromise = page.waitForEvent('download');

    await dialog.getByRole('link', { name: 'Download image' }).click();

    const download = await downloadPromise;
    const filePath = await download.path();

    expect(download.suggestedFilename()).toBe(
      'wishwe-e2e-share-flow-plan-poster.png',
    );
    expect(filePath).not.toBeNull();
    expect(await pngSize(filePath!)).toEqual({ width: 1200, height: 630 });
  });
});
