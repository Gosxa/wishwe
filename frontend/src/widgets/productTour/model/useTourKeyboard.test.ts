// @vitest-environment jsdom

import { cleanup, fireEvent, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTourKeyboard } from './useTourKeyboard';

describe('useTourKeyboard', () => {
  const goBack = vi.fn();
  const goNext = vi.fn();
  let card: HTMLDivElement;

  beforeEach(() => {
    card = document.createElement('div');
    document.body.append(card);
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  const addButton = (label: string, disabled = false) => {
    const button = document.createElement('button');

    button.textContent = label;
    button.disabled = disabled;
    card.append(button);

    return button;
  };

  const setup = (
    cardRef: { current: HTMLElement | null } = { current: card },
  ) => renderHook(() => useTourKeyboard({ cardRef, goBack, goNext }));

  const press = (
    key: string,
    init: Partial<KeyboardEventInit> & { target?: HTMLElement } = {},
  ) => {
    const { target, ...eventInit } = init;
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...eventInit,
    });

    (target ?? document).dispatchEvent(event);

    return event;
  };

  describe('step navigation', () => {
    it.each(['ArrowRight', 'PageDown'])('advances on %s', key => {
      setup();

      const event = press(key);

      expect(goNext).toHaveBeenCalledOnce();
      expect(goBack).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(true);
    });

    it.each(['ArrowLeft', 'PageUp'])('goes back on %s', key => {
      setup();

      const event = press(key);

      expect(goBack).toHaveBeenCalledOnce();
      expect(goNext).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(true);
    });

    it.each(['ArrowUp', 'ArrowDown', 'Home', 'End', ' '])(
      'swallows %s to keep the page still without navigating',
      key => {
        setup();

        const event = press(key);

        expect(event.defaultPrevented).toBe(true);
        expect(goNext).not.toHaveBeenCalled();
        expect(goBack).not.toHaveBeenCalled();
      },
    );

    it.each(['a', 'Enter', 'Escape'])('leaves %s alone', key => {
      setup();

      const event = press(key);

      expect(event.defaultPrevented).toBe(false);
      expect(goNext).not.toHaveBeenCalled();
      expect(goBack).not.toHaveBeenCalled();
    });

    it('lets Space activate a focused button instead of scrolling', () => {
      const button = addButton('Next');

      setup();

      const event = press(' ', { target: button });

      expect(event.defaultPrevented).toBe(false);
    });

    it('still swallows Space pressed outside any control', () => {
      const paragraph = document.createElement('p');

      card.append(paragraph);
      setup();

      expect(press(' ', { target: paragraph }).defaultPrevented).toBe(true);
    });

    it('stops listening after unmount', () => {
      const { unmount } = setup();

      unmount();
      press('ArrowRight');

      expect(goNext).not.toHaveBeenCalled();
    });
  });

  describe('focus trap', () => {
    it('pulls focus to the first control when Tab arrives from outside', () => {
      const first = addButton('Back');

      addButton('Next');
      setup();

      const event = press('Tab');

      expect(document.activeElement).toBe(first);
      expect(event.defaultPrevented).toBe(true);
    });

    it('pulls focus to the last control on Shift+Tab from outside', () => {
      addButton('Back');

      const last = addButton('Next');

      setup();
      press('Tab', { shiftKey: true });

      expect(document.activeElement).toBe(last);
    });

    it('wraps forward from the last control to the first', () => {
      const first = addButton('Back');
      const last = addButton('Next');

      setup();
      last.focus();

      const event = press('Tab');

      expect(document.activeElement).toBe(first);
      expect(event.defaultPrevented).toBe(true);
    });

    it('wraps backward from the first control to the last', () => {
      const first = addButton('Back');
      const last = addButton('Next');

      setup();
      first.focus();
      press('Tab', { shiftKey: true });

      expect(document.activeElement).toBe(last);
    });

    it('lets Tab move naturally between controls in the middle', () => {
      const first = addButton('Back');

      addButton('Skip');
      addButton('Next');
      setup();
      first.focus();

      const event = press('Tab');

      expect(event.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(first);
    });

    it('ignores disabled buttons when picking the trap boundaries', () => {
      const enabled = addButton('Next');

      addButton('Back', true);
      setup();
      press('Tab');

      expect(document.activeElement).toBe(enabled);
    });

    it('does nothing when the card holds no focusable control', () => {
      setup();

      expect(press('Tab').defaultPrevented).toBe(false);
    });

    it('does nothing when the card is not mounted yet', () => {
      setup({ current: null });

      expect(press('Tab').defaultPrevented).toBe(false);
    });

    it('never navigates steps on Tab', () => {
      addButton('Next');
      setup();
      press('Tab');

      expect(goNext).not.toHaveBeenCalled();
      expect(goBack).not.toHaveBeenCalled();
    });
  });

  it('rebinds when the callbacks change', () => {
    const nextGoNext = vi.fn();
    const cardRef = { current: card };
    const { rerender } = renderHook(
      ({ onNext }) => useTourKeyboard({ cardRef, goBack, goNext: onNext }),
      { initialProps: { onNext: goNext } },
    );

    rerender({ onNext: nextGoNext });
    fireEvent.keyDown(document, { key: 'ArrowRight' });

    expect(goNext).not.toHaveBeenCalled();
    expect(nextGoNext).toHaveBeenCalledOnce();
  });
});
