'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type AnimationEventHandler,
} from 'react';

type CloseHandler = () => void;

const FALLBACK_BUFFER_MS = 50;

const timeToMs = (value: string) => {
  const time = Number.parseFloat(value);

  if (!Number.isFinite(time)) return 0;

  return value.trim().endsWith('ms') ? time : time * 1000;
};

const animationTimeMs = (element: HTMLElement) => {
  const style = window.getComputedStyle(element);

  if (style.animationName === 'none') return 0;

  const durations = style.animationDuration.split(',').map(timeToMs);
  const delays = style.animationDelay.split(',').map(timeToMs);

  return durations.reduce((longest, duration, index) => {
    const delay = delays[index % delays.length] ?? 0;

    return Math.max(longest, duration + delay);
  }, 0);
};

export const useModalTransition = (onClose?: CloseHandler) => {
  const [isClosing, setIsClosing] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const completionRef = useRef<CloseHandler | undefined>(undefined);
  const isClosingRef = useRef(false);
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const finishClose = useCallback(() => {
    if (!isClosingRef.current) return;

    isClosingRef.current = false;
    setIsClosing(false);

    if (fallbackRef.current) {
      clearTimeout(fallbackRef.current);
      fallbackRef.current = null;
    }

    const completion = completionRef.current;

    completionRef.current = undefined;
    completion?.();
  }, []);

  const requestCloseWith = useCallback(
    (completion?: CloseHandler) => {
      if (isClosingRef.current) return;

      const onComplete = completion ?? onCloseRef.current;

      if (!onComplete) return;

      const overlay = overlayRef.current;
      const duration = overlay ? animationTimeMs(overlay) : 0;

      if (duration <= 0) {
        onComplete();

        return;
      }

      completionRef.current = onComplete;
      isClosingRef.current = true;
      setIsClosing(true);
      fallbackRef.current = setTimeout(
        finishClose,
        duration + FALLBACK_BUFFER_MS,
      );
    },
    [finishClose],
  );

  const requestClose = useCallback(() => {
    requestCloseWith();
  }, [requestCloseWith]);

  const handleAnimationEnd: AnimationEventHandler<HTMLDivElement> = useCallback(
    event => {
      if (event.target === event.currentTarget) finishClose();
    },
    [finishClose],
  );

  useEffect(
    () => () => {
      if (fallbackRef.current) clearTimeout(fallbackRef.current);
    },
    [],
  );

  return {
    requestClose,
    requestCloseWith,
    overlayRef,
    modalTransitionProps: {
      ref: overlayRef,
      'data-modal-state': isClosing ? ('closing' as const) : ('open' as const),
      onAnimationEnd: handleAnimationEnd,
    },
  };
};
