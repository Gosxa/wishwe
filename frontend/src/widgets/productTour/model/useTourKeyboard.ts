'use client';

import { useEffect } from 'react';
import type { RefObject } from 'react';

const CARD_KEYS = new Set([
  'ArrowRight',
  'ArrowLeft',
  'ArrowDown',
  'ArrowUp',
  'PageDown',
  'PageUp',
  'Home',
  'End',
  ' ',
]);

const FOCUSABLE =
  'button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])';

const trapTabFocus = (event: KeyboardEvent, card: HTMLElement | null) => {
  const focusable = card?.querySelectorAll<HTMLElement>(FOCUSABLE);

  if (!focusable?.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  const isInside = card?.contains(active) ?? false;

  if (!isInside) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
};

const isSpaceOnFocusable = (event: KeyboardEvent) =>
  event.key === ' ' &&
  event.target instanceof HTMLElement &&
  event.target.closest(FOCUSABLE) !== null;

type Options = {
  cardRef: RefObject<HTMLElement | null>;
  goBack: () => void;
  goNext: () => void;
  enabled?: boolean;
};

export const useTourKeyboard = ({
  cardRef,
  goBack,
  goNext,
  enabled = true,
}: Options) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        trapTabFocus(event, cardRef.current);

        return;
      }

      if (!CARD_KEYS.has(event.key) || isSpaceOnFocusable(event)) return;

      event.preventDefault();

      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        goBack();
      } else if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        goNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cardRef, enabled, goBack, goNext]);
};
