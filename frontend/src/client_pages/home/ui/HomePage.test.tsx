// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@widgets/header', () => ({
  Header: () => <header />,
}));

vi.mock('@widgets/sidebar', () => ({
  Sidebar: () => <nav />,
}));

vi.mock('@widgets/productTour', () => ({
  FeedTour: () => <div data-testid="feed-tour" />,
}));

vi.mock('@client_pages/home/model/useFeedSearch', () => ({
  useFeedSearch: () => ({}),
}));

vi.mock('../widgets/feed', () => ({
  Feed: () => <section />,
}));

import HomePage from './HomePage';

describe('HomePage', () => {
  afterEach(cleanup);

  it('shows the first-visit tour by default', () => {
    render(<HomePage />);

    expect(screen.getByTestId('feed-tour')).toBeTruthy();
  });

  it('does not mount the tour when another experience owns the screen', () => {
    render(<HomePage showTour={false} />);

    expect(screen.queryByTestId('feed-tour')).toBeNull();
  });
});
