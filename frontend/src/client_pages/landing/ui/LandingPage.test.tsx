// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prefetch: vi.fn(),
  push: vi.fn(),
  smoothScrollTo: vi.fn(),
  smoothScrollToSelector: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ prefetch: mocks.prefetch, push: mocks.push }),
}));

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock('@/shared/lib/smoothScroll', () => ({
  smoothScrollTo: mocks.smoothScrollTo,
  smoothScrollToSelector: mocks.smoothScrollToSelector,
}));

import { LandingPage } from './LandingPage';

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 120,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 800,
    });
  });

  afterEach(cleanup);

  it('assembles the complete conversion page in the intended order', () => {
    const { container } = render(<LandingPage />);

    const headings = Array.from(container.querySelectorAll('h1, h2')).map(
      heading => heading.textContent,
    );

    expect(headings).toEqual(
      expect.arrayContaining([
        'See faces, not screens',
        'Organizing meetups made simple',
        "Why you'll love WishWe:",
        'Be the first to know when we launch 🚀',
        'Ready to add your first Wish?',
      ]),
    );
    expect(mocks.prefetch).toHaveBeenCalledWith('/thank-you');
  });

  it('wires every landing navigation control to smooth scrolling', () => {
    render(<LandingPage />);

    const earlyAccessLinks = screen.getAllByRole('link', {
      name: 'Get Early Access',
    });

    fireEvent.click(earlyAccessLinks[0]);
    fireEvent.click(screen.getByRole('link', { name: 'How it works?' }));
    fireEvent.click(earlyAccessLinks[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Scroll down' }));

    expect(mocks.smoothScrollToSelector.mock.calls).toEqual([
      ['#waitlist'],
      ['#how-it-works'],
      ['#waitlist'],
    ]);
    expect(mocks.smoothScrollTo).toHaveBeenCalledWith(920);
  });
});
