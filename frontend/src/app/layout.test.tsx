// @vitest-environment jsdom

import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SITE_URL } from '@/shared/lib/metadata';

vi.mock('next/font/local', () => ({
  default: () => ({ variable: 'font-sk-modernist' }),
}));

vi.mock('next/font/google', () => ({
  Instrument_Serif: () => ({ variable: 'font-instrument-serif' }),
  Poppins: () => ({ variable: 'font-poppins' }),
}));

vi.mock('@/shared/ui/globalLoader/GlobalLoader', () => ({
  GlobalLoader: () => <div data-testid="global-loader" />,
}));

import RootLayout, { metadata } from './layout';

type Element = ReactElement<Record<string, unknown>>;

const tree = () =>
  RootLayout({ children: <main data-testid="page" /> }) as Element;

describe('root layout metadata', () => {
  it('sets an absolute metadata base so crawlers get absolute og:image urls', () => {
    const metadataBase = metadata.metadataBase as URL;
    const [image] = metadata.openGraph?.images as [{ url: string }];

    expect(metadataBase).toBeInstanceOf(URL);
    expect(metadataBase.origin).toBe(SITE_URL);
    expect(new URL(image.url, metadataBase).href).toBe(
      `${SITE_URL}/og-image.jpg`,
    );
  });

  it('provides the default title and description for every route', () => {
    expect(metadata.title).toBe('WishWe — see faces, not screens');
    expect(metadata.description).toEqual(expect.any(String));
    expect(metadata.openGraph?.title).toBe(metadata.title);
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' });
  });
});

describe('root layout', () => {
  it('declares the document language', () => {
    expect(tree().type).toBe('html');
    expect(tree().props.lang).toBe('en');
  });

  it('exposes every font as a css variable class', () => {
    const className = tree().props.className as string;

    expect(className).toContain('font-sk-modernist');
    expect(className).toContain('font-instrument-serif');
    expect(className).toContain('font-poppins');
  });

  it('mounts the global loader above the page content', () => {
    const body = tree().props.children as Element;
    const [loader, children] = body.props.children as [Element, Element];

    expect(body.type).toBe('body');
    expect(loader.type).toEqual(expect.any(Function));
    expect(children.props['data-testid']).toBe('page');
  });
});
