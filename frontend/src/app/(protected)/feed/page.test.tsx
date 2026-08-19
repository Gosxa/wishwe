// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/client_pages', () => ({
  HomePage: () => <div data-testid="home-page" />,
}));

import Page, { metadata } from './page';

describe('(protected)/feed page', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the home feed', () => {
    render(<Page />);

    expect(screen.getByTestId('home-page')).toBeDefined();
  });

  it('uses the shared-invite copy, because /feed?event=N is the link users paste', () => {
    expect(metadata.title).toBe('Feed · WishWe');
    expect(metadata.openGraph?.title).toBe('You’re invited on WishWe');
    expect(metadata.twitter?.title).toBe('You’re invited on WishWe');
  });
});
