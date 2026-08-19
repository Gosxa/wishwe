// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/client_pages', () => ({
  FriendsPage: () => <div data-testid="friends-page" />,
}));

import Page from './page';

describe('(protected)/friends page', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the friends page', () => {
    render(<Page />);

    expect(screen.getByTestId('friends-page')).toBeDefined();
  });
});
