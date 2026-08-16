// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useModalAttention } from './useModalAttention';

const TestModal = () => {
  const pulseModal = useModalAttention();

  return (
    <div data-testid="overlay" onClick={pulseModal}>
      <div data-modal-content data-testid="modal">
        Content
      </div>
    </div>
  );
};

const installAnimateMock = () => {
  const cancel = vi.fn();
  const animate = vi.fn(() => ({ cancel }) as unknown as Animation);

  Object.defineProperty(HTMLElement.prototype, 'animate', {
    configurable: true,
    value: animate,
  });

  return { animate, cancel };
};

describe('useModalAttention', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    delete (
      HTMLElement.prototype as { animate?: typeof Element.prototype.animate }
    ).animate;
    delete (window as { matchMedia?: typeof window.matchMedia }).matchMedia;
  });

  it('pulses only when the backdrop itself is clicked', () => {
    const { animate, cancel } = installAnimateMock();

    const { unmount } = render(<TestModal />);

    fireEvent.click(screen.getByTestId('modal'));
    expect(animate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('overlay'));
    expect(animate).toHaveBeenCalledWith(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.015)', offset: 0.5 },
        { transform: 'scale(1)' },
      ],
      {
        duration: 360,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    );

    fireEvent.click(screen.getByTestId('overlay'));
    expect(cancel).toHaveBeenCalledTimes(1);

    unmount();
    expect(cancel).toHaveBeenCalledTimes(2);
  });

  it('does not animate when reduced motion is requested', () => {
    const { animate } = installAnimateMock();

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: true }) as MediaQueryList),
    });

    render(<TestModal />);
    fireEvent.click(screen.getByTestId('overlay'));

    expect(animate).not.toHaveBeenCalled();
  });
});
