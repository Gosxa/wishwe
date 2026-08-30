// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/client_pages', () => ({
  NotFound: () => <div data-testid="not-found" />,
}));

import NotFoundPage, { metadata } from './not-found';

describe('not-found page', () => {
  afterEach(cleanup);

  it('renders the shared 404 screen', () => {
    render(<NotFoundPage />);

    expect(screen.getByTestId('not-found')).toBeDefined();
  });

  it('titles the tab so a stray link is recognisable in history', () => {
    expect(metadata.title).toBe('Page not found · WishWe');
  });
});
