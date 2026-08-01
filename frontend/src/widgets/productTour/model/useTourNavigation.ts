'use client';

import { useCallback, useRef, useState } from 'react';
import type { TourEndReason } from './types';

const EXIT_MS = 260;

export const useTourNavigation = (
  stepsCount: number,
  onEnd: (reason: TourEndReason) => void,
) => {
  const [index, setIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const endedRef = useRef(false);

  const isLast = index === stepsCount - 1;

  const end = useCallback(
    (reason: TourEndReason) => {
      if (endedRef.current) return;

      endedRef.current = true;
      setIsExiting(true);
      window.setTimeout(() => onEnd(reason), EXIT_MS);
    },
    [onEnd],
  );

  const goNext = useCallback(() => {
    if (endedRef.current) return;

    if (isLast) {
      end('finished');
    } else {
      setIndex(current => current + 1);
    }
  }, [end, isLast]);

  const goBack = useCallback(() => {
    setIndex(current => Math.max(0, current - 1));
  }, []);

  return { index, isLast, isExiting, end, goBack, goNext };
};
