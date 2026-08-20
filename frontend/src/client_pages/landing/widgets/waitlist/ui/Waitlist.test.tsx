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
  push: vi.fn(),
  prefetch: vi.fn(),
}));

const router = {
  push: navigationMocks.push,
  prefetch: navigationMocks.prefetch,
};

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}));

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

import { Waitlist } from './Waitlist';

const EXIT_DURATION = 760;

describe('Waitlist', () => {
  let reducedMotion: boolean;

  beforeEach(() => {
    vi.useFakeTimers();
    reducedMotion = false;
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-reduced-motion') && reducedMotion,
      media: query,
    }));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  const nameInput = () => screen.getByPlaceholderText('Name');
  const emailInput = () => screen.getByPlaceholderText('Email');
  const submitButton = () =>
    screen.getByRole('button', { name: /Get Early Access|You're in!/ });

  const fill = (name: string, email: string) => {
    fireEvent.change(nameInput(), { target: { value: name } });
    fireEvent.change(emailInput(), { target: { value: email } });
  };

  const submit = () => fireEvent.click(submitButton());

  const advance = (milliseconds: number) =>
    act(() => {
      vi.advanceTimersByTime(milliseconds);
    });

  it('warms up the destination route on mount', () => {
    render(<Waitlist />);

    expect(navigationMocks.prefetch).toHaveBeenCalledWith('/thank-you');
  });

  describe('validation', () => {
    it('blocks an empty submission and explains both fields', () => {
      render(<Waitlist />);

      submit();

      expect(navigationMocks.push).not.toHaveBeenCalled();
      expect(
        screen.getByText('Name must be at least 2 characters'),
      ).toBeTruthy();
      expect(
        screen.getByText('Please enter a valid email address'),
      ).toBeTruthy();
    });

    it.each([
      ['a', 'Name must be at least 2 characters'],
      ['a'.repeat(51), 'Name must be less than 50 characters'],
      [
        'Amy2',
        'Name can only contain letters, spaces, hyphens and apostrophes',
      ],
      [
        'Amy!',
        'Name can only contain letters, spaces, hyphens and apostrophes',
      ],
    ])('rejects the name %s', (name, message) => {
      render(<Waitlist />);

      fill(name, 'amy@example.com');
      submit();

      expect(screen.getByText(message)).toBeTruthy();
      expect(navigationMocks.push).not.toHaveBeenCalled();
    });

    it.each(["O'Brien", 'Mary-Jane', 'Amy Lee', 'Al'])(
      'accepts the name %s',
      name => {
        render(<Waitlist />);

        fill(name, 'amy@example.com');
        submit();

        expect(
          screen.queryByText(
            'Name can only contain letters, spaces, hyphens and apostrophes',
          ),
        ).toBeNull();
      },
    );

    it.each(['not-an-email', 'amy@', '@example.com', ''])(
      'rejects the email %s',
      email => {
        render(<Waitlist />);

        fill('Amy Lee', email);
        submit();

        expect(
          screen.getByText('Please enter a valid email address'),
        ).toBeTruthy();
        expect(navigationMocks.push).not.toHaveBeenCalled();
      },
    );

    it('does not start the exit animation for an invalid submission', () => {
      render(<Waitlist />);

      fill('Amy Lee', 'nope');
      submit();
      advance(EXIT_DURATION * 2);

      expect(navigationMocks.push).not.toHaveBeenCalled();
      expect(submitButton().textContent).toBe('Get Early Access');
    });

    it('clears the error once the value is corrected', () => {
      render(<Waitlist />);

      fill('a', 'amy@example.com');
      submit();

      expect(
        screen.getByText('Name must be at least 2 characters'),
      ).toBeTruthy();

      fill('Amy Lee', 'amy@example.com');
      submit();

      expect(
        screen.queryByText('Name must be at least 2 characters'),
      ).toBeNull();
    });
  });

  describe('successful submission', () => {
    it('plays the exit animation before navigating', () => {
      render(<Waitlist />);

      fill('Amy Lee', 'amy@example.com');
      submit();

      expect(submitButton().textContent).toBe("You're in!");
      expect(navigationMocks.push).not.toHaveBeenCalled();

      advance(EXIT_DURATION - 1);
      expect(navigationMocks.push).not.toHaveBeenCalled();

      advance(1);
      expect(navigationMocks.push).toHaveBeenCalledOnce();
      expect(navigationMocks.push).toHaveBeenCalledWith('/thank-you');
    });

    it('disables the button while leaving', () => {
      render(<Waitlist />);

      fill('Amy Lee', 'amy@example.com');
      submit();

      expect(submitButton().getAttribute('aria-disabled')).toBe('true');
    });

    it('ignores repeat submissions while the animation runs', () => {
      render(<Waitlist />);

      fill('Amy Lee', 'amy@example.com');
      submit();
      submit();
      submit();
      advance(EXIT_DURATION);

      expect(navigationMocks.push).toHaveBeenCalledOnce();
    });

    it('navigates straight away when the user prefers reduced motion', () => {
      reducedMotion = true;
      render(<Waitlist />);

      fill('Amy Lee', 'amy@example.com');
      submit();

      expect(navigationMocks.push).toHaveBeenCalledOnce();
      expect(navigationMocks.push).toHaveBeenCalledWith('/thank-you');
      expect(submitButton().textContent).toBe('Get Early Access');
    });

    it('does not navigate after the section unmounts mid-animation', () => {
      const { unmount } = render(<Waitlist />);

      fill('Amy Lee', 'amy@example.com');
      submit();
      unmount();
      advance(EXIT_DURATION * 2);

      expect(navigationMocks.push).not.toHaveBeenCalled();
    });

    it('submits through the form so Enter in a field works too', () => {
      const { container } = render(<Waitlist />);

      fill('Amy Lee', 'amy@example.com');
      fireEvent.submit(container.querySelector('form')!);
      advance(EXIT_DURATION);

      expect(navigationMocks.push).toHaveBeenCalledWith('/thank-you');
    });
  });

  describe('optional survey', () => {
    it('submits fine without an answer', () => {
      render(<Waitlist />);

      fill('Amy Lee', 'amy@example.com');
      submit();
      advance(EXIT_DURATION);

      expect(navigationMocks.push).toHaveBeenCalledWith('/thank-you');
    });

    it('records the struggle the visitor picks', () => {
      render(<Waitlist />);

      const dropdown = screen.getByRole('button', { name: /meetup struggle/ });

      expect(dropdown.textContent).toContain('Select an option...');

      fireEvent.click(dropdown);
      fireEvent.click(
        screen.getByRole('option', { name: 'Deciding where to go' }),
      );

      expect(dropdown.textContent).toContain('Deciding where to go');
    });
  });
});
