'use client';

import { useEffect, useRef, useState } from 'react';

export type PlanConversionState = 'idle' | 'converting' | 'success' | 'closing';

export const PLAN_CONVERSION_EXIT_MS = 300;

const ASSEMBLY_MS = 900;
const SUCCESS_MS = 3500;

export const usePlanConversionTransition = (onComplete: () => void) => {
  const [state, setState] = useState<PlanConversionState>('idle');
  const active = useRef(false);
  const startedAt = useRef(0);
  const reducedMotion = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeRef = useRef(onComplete);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(
    () => () => {
      active.current = false;
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  const start = () => {
    active.current = true;
    startedAt.current = Date.now();
    reducedMotion.current = Boolean(
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    );
    setState('converting');
  };

  const succeed = () => {
    if (!active.current) return;

    const remaining = reducedMotion.current
      ? 0
      : Math.max(0, ASSEMBLY_MS - (Date.now() - startedAt.current));

    timer.current = setTimeout(() => {
      setState('success');
      timer.current = setTimeout(
        () => {
          if (reducedMotion.current) {
            timer.current = null;
            completeRef.current();

            return;
          }

          setState('closing');
          timer.current = setTimeout(() => {
            timer.current = null;
            completeRef.current();
          }, PLAN_CONVERSION_EXIT_MS);
        },
        reducedMotion.current ? 120 : SUCCESS_MS,
      );
    }, remaining);
  };

  const fail = () => {
    if (!active.current) return;

    active.current = false;
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    setState('idle');
  };

  return { state, start, succeed, fail };
};
