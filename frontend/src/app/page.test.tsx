// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/client_pages', () => ({
  LandingPage: () => <div data-testid="landing-page" />,
}));

import Page from './page';

describe('/ page', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the landing page', () => {
    render(<Page />);

    expect(screen.getByTestId('landing-page')).toBeDefined();
  });
});
