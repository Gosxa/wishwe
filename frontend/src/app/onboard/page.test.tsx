// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type OnBoardProps = { next?: string | null };

const mocks = vi.hoisted(() => ({ onBoard: vi.fn() }));

vi.mock('@/client_pages', () => ({
  OnBoard: (props: OnBoardProps) => {
    mocks.onBoard(props);

    return <div data-testid="onboard">{props.next ?? 'no-next'}</div>;
  },
}));

import Page, { metadata } from './page';

type Query = Record<string, string | string[] | undefined>;

const renderPage = async (searchParams: Query) =>
  render(await Page({ searchParams: Promise.resolve(searchParams) }));

const nextProp = () => mocks.onBoard.mock.calls.at(-1)![0].next;

describe('onboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('keeps a safe scalar return path', async () => {
    await renderPage({ next: '/feed' });

    expect(nextProp()).toBe('/feed');
    expect(screen.getByTestId('onboard').textContent).toBe('/feed');
  });

  it('keeps the query string of the return path', async () => {
    await renderPage({ next: '/feed?event=12&tab=wishes' });

    expect(nextProp()).toBe('/feed?event=12&tab=wishes');
  });

  it('drops the fragment, which the browser never sends anyway', async () => {
    await renderPage({ next: '/feed?event=12#card' });

    expect(nextProp()).toBe('/feed?event=12');
  });

  it('renders without a return path when the query is empty', async () => {
    await renderPage({});

    expect(nextProp()).toBeNull();
    expect(screen.getByTestId('onboard').textContent).toBe('no-next');
  });

  it('ignores a repeated next parameter instead of trusting the first value', async () => {
    await renderPage({ next: ['/feed', 'https://evil.example'] });

    expect(nextProp()).toBeNull();
  });

  it('ignores a repeated next parameter even when every value is safe', async () => {
    await renderPage({ next: ['/feed', '/profile'] });

    expect(nextProp()).toBeNull();
  });

  it.each([
    ['an absolute external url', 'https://evil.example/steal'],
    ['onboarding itself, which would loop', '/onboard'],
  ])('rejects %s', async (_label, next) => {
    await renderPage({ next });

    expect(nextProp()).toBeNull();
  });

  it('ignores unrelated query parameters', async () => {
    await renderPage({ token: 'abc', utm_source: 'mail' });

    expect(nextProp()).toBeNull();
  });

  it('exposes share-friendly metadata', () => {
    expect(metadata.title).toBe('Join WishWe');
    expect(metadata.openGraph?.title).toBe('You’re invited on WishWe');
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' });
  });
});
