import { useCallback, useEffect, useRef } from 'react';
import { quickFillDuration, splitQuickFillWords } from '@/shared/lib/quickFill';
import { useQuickFillStore } from '@/shared/store/useQuickFillStore';

type QuickFillRun = {
  tourId: string;
  value: string;
  fill: (value: string) => void;
  onSettled: () => void;
};

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const useQuickFillTyping = () => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settle = useRef<(() => void) | null>(null);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    const pending = settle.current;

    settle.current = null;
    useQuickFillStore.getState().stop();

    return pending;
  }, []);

  const skipQuickFill = useCallback(() => {
    clear()?.();
  }, [clear]);

  const cancelQuickFill = useCallback(() => {
    clear();
  }, [clear]);

  const runQuickFill = useCallback(
    ({ tourId, value, fill, onSettled }: QuickFillRun) => {
      if (settle.current) {
        skipQuickFill();

        return;
      }

      fill(value);

      const words = splitQuickFillWords(value);
      const duration = prefersReducedMotion()
        ? 0
        : quickFillDuration(words.length);

      if (duration === 0) {
        onSettled();

        return;
      }

      settle.current = onSettled;
      useQuickFillStore.getState().start(tourId, value);
      timer.current = setTimeout(skipQuickFill, duration);
    },
    [skipQuickFill],
  );

  useEffect(() => cancelQuickFill, [cancelQuickFill]);

  return { runQuickFill, cancelQuickFill };
};
