// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/client_pages', () => ({
  ThankYou: () => <div data-testid="thank-you" />,
}));

import Page from './page';

describe('/thank-you page', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the thank-you screen', () => {
    render(<Page />);

    expect(screen.getByTestId('thank-you')).toBeDefined();
  });
});
