'use client';

import { useCallback, useEffect, useRef, type KeyboardEvent } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const isVisible = (element: HTMLElement) =>
  element.offsetWidth > 0 || element.offsetHeight > 0;

type Options = {
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
};

export const useFocusTrap = ({
  initialFocusRef,
  returnFocusRef,
  enabled = true,
}: Options = {}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const focusableIn = useCallback((container: HTMLElement) => {
    return Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE),
    ).filter(isVisible);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    const initial =
      initialFocusRef?.current ??
      (container ? focusableIn(container)[0] : null) ??
      null;
    const returnTarget = returnFocusRef?.current ?? previouslyFocused;

    initial?.focus();

    return () => {
      if (returnTarget?.isConnected) returnTarget.focus();
    };
  }, [enabled, focusableIn, initialFocusRef, returnFocusRef]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Tab') return;

      const elements = focusableIn(event.currentTarget);

      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];
      const active = document.activeElement;

      if (
        event.shiftKey &&
        (active === first || active === event.currentTarget)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [focusableIn],
  );

  return {
    containerProps: {
      ref: containerRef,
      onKeyDown: handleKeyDown,
    },
  };
};
