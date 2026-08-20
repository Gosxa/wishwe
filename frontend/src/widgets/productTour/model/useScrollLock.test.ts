// @vitest-environment jsdom

import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useScrollLock } from './useScrollLock';

describe('useScrollLock', () => {
  let overlay: HTMLDivElement;

  beforeEach(() => {
    overlay = document.createElement('div');
    document.body.append(overlay);
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  const setup = (
    ref: { current: HTMLDivElement | null } = { current: overlay },
  ) => renderHook(() => useScrollLock(ref));

  const scroll = (
    type: 'wheel' | 'touchmove',
    target: EventTarget = overlay,
  ) => {
    const event = new Event(type, { bubbles: true, cancelable: true });

    target.dispatchEvent(event);

    return event;
  };

  it.each(['wheel', 'touchmove'] as const)(
    'blocks %s over the overlay',
    type => {
      setup();

      expect(scroll(type).defaultPrevented).toBe(true);
    },
  );

  it('blocks scrolling that starts on a child of the overlay', () => {
    const child = document.createElement('p');

    overlay.append(child);
    setup();

    expect(scroll('wheel', child).defaultPrevented).toBe(true);
  });

  it('leaves scrolling outside the overlay alone', () => {
    const outside = document.createElement('div');

    document.body.append(outside);
    setup();

    expect(scroll('wheel', outside).defaultPrevented).toBe(false);
  });

  it('registers the listeners as non-passive so preventDefault works', () => {
    const addEventListener = vi.spyOn(overlay, 'addEventListener');

    setup();

    expect(addEventListener).toHaveBeenCalledWith(
      'wheel',
      expect.any(Function),
      { passive: false },
    );
    expect(addEventListener).toHaveBeenCalledWith(
      'touchmove',
      expect.any(Function),
      { passive: false },
    );
  });

  it.each(['wheel', 'touchmove'] as const)(
    'releases the %s lock on unmount',
    type => {
      const { unmount } = setup();

      unmount();

      expect(scroll(type).defaultPrevented).toBe(false);
    },
  );

  it('does nothing when the overlay is not mounted', () => {
    const { unmount } = setup({ current: null });

    expect(() => unmount()).not.toThrow();
    expect(scroll('wheel').defaultPrevented).toBe(false);
  });

  it('moves the lock when the overlay ref changes', () => {
    const next = document.createElement('div');

    document.body.append(next);

    const { rerender } = renderHook(({ ref }) => useScrollLock(ref), {
      initialProps: { ref: { current: overlay } },
    });

    rerender({ ref: { current: next } });

    expect(scroll('wheel', next).defaultPrevented).toBe(true);
    expect(scroll('wheel', overlay).defaultPrevented).toBe(false);
  });
});
