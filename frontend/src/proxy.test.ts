import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ authMiddleware: vi.fn() }));

vi.mock('@/app/_server/auth/middleware', () => ({
  authMiddleware: mocks.authMiddleware,
}));

import { config, proxy } from './proxy';

const matches = (pathname: string) =>
  new RegExp(`^${config.matcher[0]}$`).test(pathname);

describe('proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates the request to the auth middleware and returns its response', () => {
    const request = { nextUrl: { pathname: '/feed' } } as NextRequest;
    const response = { ok: true };

    mocks.authMiddleware.mockReturnValue(response);

    expect(proxy(request)).toBe(response);
    expect(mocks.authMiddleware).toHaveBeenCalledTimes(1);
    expect(mocks.authMiddleware).toHaveBeenCalledWith(request);
  });

  it('declares exactly one matcher', () => {
    expect(config.matcher).toHaveLength(1);
  });

  it.each([
    ['the landing page', '/'],
    ['the feed', '/feed'],
    ['a feed deep link', '/feed'],
    ['the profile page', '/profile'],
    ['the edit-profile page', '/edit-profile'],
    ['the friends page', '/friends'],
    ['a public share link', '/share/tok-123'],
    ['a public profile', '/user/ann'],
  ])('guards %s', (_label, pathname) => {
    expect(matches(pathname)).toBe(true);
  });

  it.each([
    ['static chunks', '/_next/static/chunks/main.js'],
    ['optimized images', '/_next/image'],
    ['the analytics script', '/_vercel/insights/script.js'],
    ['the analytics beacon', '/_vercel/insights/event'],
    ['the favicon', '/favicon.ico'],
    ['local fonts', '/fonts/Sk-Modernist-Regular.otf'],
    ['onboarding', '/onboard'],
    ['the google callback', '/auth/google/callback'],
    ['invite landings', '/invite/tok-123'],
    ['the invite join flow', '/invite/tok-123/join'],
    ['the thank-you page', '/thank-you'],
    ['next api routes', '/next_api/auth/login'],
    ['backend proxy routes', '/api/user/profile'],
    ['the test playground', '/test/cropper'],
    ['svg assets', '/icon.svg'],
    ['ico assets', '/apple-touch-icon.ico'],
    ['png assets', '/og-image.png'],
    ['jpg assets', '/og-image.jpg'],
    ['webp assets', '/hero.webp'],
    ['nested image assets', '/images/hero/large.png'],
  ])('skips %s', (_label, pathname) => {
    expect(matches(pathname)).toBe(false);
  });

  it.each([
    ['/onboarding-guide'],
    ['/apiary'],
    ['/authors'],
    ['/invitees'],
    ['/testimonials'],
  ])('also skips %s, because the exclusions match by prefix', pathname => {
    expect(matches(pathname)).toBe(false);
  });
});
