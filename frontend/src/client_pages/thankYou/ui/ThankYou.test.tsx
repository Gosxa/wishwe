// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const navigationMocks = vi.hoisted(() => ({
  prefetch: vi.fn(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigationMocks,
}));

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

import { ThankYou } from './ThankYou';

describe('ThankYou', () => {
  let reducedMotion: boolean;

  beforeEach(() => {
    vi.useFakeTimers();
    reducedMotion = false;
    vi.stubGlobal('matchMedia', () => ({ matches: reducedMotion }));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('prefetches onboarding and waits for the exit animation before navigating', () => {
    render(<ThankYou />);

    expect(navigationMocks.prefetch).toHaveBeenCalledWith('/onboard');

    const invite = screen.getByRole('link', { name: 'Invite friends' });

    fireEvent.click(invite);
    fireEvent.click(invite);

    expect(invite.getAttribute('aria-disabled')).toBe('true');
    expect(navigationMocks.push).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(319));
    expect(navigationMocks.push).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(navigationMocks.push).toHaveBeenCalledTimes(1);
    expect(navigationMocks.push).toHaveBeenCalledWith('/onboard');
  });

  it('navigates immediately when reduced motion is preferred', () => {
    reducedMotion = true;
    render(<ThankYou />);

    fireEvent.click(screen.getByRole('link', { name: 'Invite friends' }));

    expect(navigationMocks.push).toHaveBeenCalledWith('/onboard');
    expect(
      screen
        .getByRole('link', { name: 'Invite friends' })
        .getAttribute('aria-disabled'),
    ).toBe('false');
  });

  it('leaves modified clicks to the browser', () => {
    render(<ThankYou />);

    fireEvent.click(screen.getByRole('link', { name: 'Invite friends' }), {
      ctrlKey: true,
    });

    expect(navigationMocks.push).not.toHaveBeenCalled();
    expect(
      screen
        .getByRole('link', { name: 'Invite friends' })
        .getAttribute('aria-disabled'),
    ).toBe('false');
  });
});
