import { describe, expect, it } from 'vitest';

import {
  buildMetadata,
  SHARE_DESCRIPTION,
  SHARE_TITLE,
  SITE_URL,
} from './metadata';

const base = {
  title: 'Feed · WishWe',
  description: 'Wishes and plans from your friends.',
};

describe('SITE_URL', () => {
  it('is an absolute https origin that can seed metadataBase', () => {
    const url = new URL(SITE_URL);

    expect(url.protocol).toBe('https:');
    expect(url.origin).toBe(SITE_URL);
  });

  it('has no trailing slash, so relative asset paths join cleanly', () => {
    expect(SITE_URL.endsWith('/')).toBe(false);
    expect(new URL('/og-image.jpg', SITE_URL).href).toBe(
      `${SITE_URL}/og-image.jpg`,
    );
  });
});

describe('buildMetadata', () => {
  it('uses the page title and description everywhere by default', () => {
    const meta = buildMetadata(base);

    expect(meta.title).toBe(base.title);
    expect(meta.description).toBe(base.description);
    expect(meta.openGraph?.title).toBe(base.title);
    expect(meta.openGraph?.description).toBe(base.description);
    expect(meta.twitter?.title).toBe(base.title);
    expect(meta.twitter?.description).toBe(base.description);
  });

  it('keeps the tab title while overriding only the shared copy', () => {
    const meta = buildMetadata({
      ...base,
      shareTitle: SHARE_TITLE,
      shareDescription: SHARE_DESCRIPTION,
    });

    expect(meta.title).toBe(base.title);
    expect(meta.description).toBe(base.description);
    expect(meta.openGraph?.title).toBe(SHARE_TITLE);
    expect(meta.openGraph?.description).toBe(SHARE_DESCRIPTION);
    expect(meta.twitter?.title).toBe(SHARE_TITLE);
    expect(meta.twitter?.description).toBe(SHARE_DESCRIPTION);
  });

  it('allows overriding the share title alone', () => {
    const meta = buildMetadata({ ...base, shareTitle: SHARE_TITLE });

    expect(meta.openGraph?.title).toBe(SHARE_TITLE);
    expect(meta.openGraph?.description).toBe(base.description);
  });

  it('declares a stable website card', () => {
    const meta = buildMetadata(base);

    expect(meta.openGraph).toMatchObject({
      type: 'website',
      siteName: 'WishWe',
      locale: 'en_US',
    });
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image' });
  });

  it('ships a sized Open Graph image with alt text', () => {
    const meta = buildMetadata(base);
    const images = meta.openGraph?.images;

    expect(images).toEqual([
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: expect.any(String),
      },
    ]);
  });

  it('resolves the Open Graph image to an absolute url through the site origin', () => {
    const meta = buildMetadata(base);
    const [image] = meta.openGraph?.images as [{ url: string }];

    expect(new URL(image.url, SITE_URL).href).toBe(`${SITE_URL}/og-image.jpg`);
  });

  it('gives Twitter the same image as Open Graph', () => {
    const meta = buildMetadata(base);
    const [ogImage] = meta.openGraph?.images as [{ url: string }];

    expect(meta.twitter?.images).toEqual([ogImage.url]);
  });

  it('produces identical image metadata for every page', () => {
    const first = buildMetadata(base);
    const second = buildMetadata({ title: 'Other', description: 'Other page' });

    expect(second.openGraph?.images).toEqual(first.openGraph?.images);
    expect(second.twitter?.images).toEqual(first.twitter?.images);
  });
});
