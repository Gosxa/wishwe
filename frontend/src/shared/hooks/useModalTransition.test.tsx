// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useModalTransition } from './useModalTransition';

const TestModal = ({ onClose }: { onClose: () => void }) => {
  const { requestClose, modalTransitionProps } = useModalTransition(onClose);

  return (
    <div
      {...modalTransitionProps}
      data-testid="overlay"
      style={{ animationName: 'modal-overlay-in', animationDuration: '240ms' }}
    >
      <button type="button" onClick={requestClose}>
        Close
      </button>
      <span data-testid="content" />
    </div>
  );
};

describe('useModalTransition', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('waits for the overlay exit animation before closing', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    render(<TestModal onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    const overlay = screen.getByTestId('overlay');

    expect(overlay.getAttribute('data-modal-state')).toBe('closing');
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.animationEnd(screen.getByTestId('content'));
    expect(onClose).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(290));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes immediately when CSS animations are disabled', () => {
    const onClose = vi.fn();

    render(<TestModal onClose={onClose} />);
    const closeButton = screen.getByRole('button', { name: 'Close' });

    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      animationName: 'none',
      animationDuration: '0s',
      animationDelay: '0s',
    } as CSSStyleDeclaration);

    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledOnce();
  });
});
