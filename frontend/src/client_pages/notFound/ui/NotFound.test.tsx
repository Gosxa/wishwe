// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const navigationMocks = vi.hoisted(() => ({
  back: vi.fn(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigationMocks,
}));

import { NotFound } from './NotFound';

const setHistoryLength = (length: number) =>
  Object.defineProperty(window.history, 'length', {
    configurable: true,
    value: length,
  });

describe('NotFound', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('points both the logo and the primary action at the feed', () => {
    render(<NotFound />);

    expect(
      screen.getByRole('link', { name: 'WishWe home' }).getAttribute('href'),
    ).toBe('/feed');
    expect(
      screen.getByRole('link', { name: 'Take me home' }).getAttribute('href'),
    ).toBe('/feed');
  });

  it('announces the status code that the numerals only show visually', () => {
    render(<NotFound />);

    expect(screen.getByText('Error 404 — page not found')).toBeTruthy();
  });

  it('goes back when there is history to go back to', () => {
    setHistoryLength(3);
    render(<NotFound />);

    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));

    expect(navigationMocks.back).toHaveBeenCalledTimes(1);
    expect(navigationMocks.push).not.toHaveBeenCalled();
  });

  it('falls back to the feed when the 404 is the first history entry', () => {
    setHistoryLength(1);
    render(<NotFound />);

    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));

    expect(navigationMocks.back).not.toHaveBeenCalled();
    expect(navigationMocks.push).toHaveBeenCalledWith('/feed');
  });
});
