'use client';

import { useCallback, useMemo, useRef } from 'react';
import {
  summon,
  erase,
  moveTrack,
  ANIMATION_SPEED,
} from '../../lib/trackActions';

export const useTrack = () => {
  const stepRef = useRef(0);
  const VPRef = useRef<HTMLDivElement | null>(null);
  const screenRefs = useRef<(HTMLDivElement | null)[]>([]);

  const registerScreen = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      screenRefs.current[index] = el;
      if (el && index !== 0) {
        el.setAttribute('inert', '');
      }
    },
    [],
  );

  const goForward = useCallback((toIndex: number) => {
    stepRef.current += 1;
    summon(screenRefs.current, toIndex);
    moveTrack(VPRef.current, stepRef.current);
  }, []);

  const goBack = useCallback((fromIndex: number) => {
    stepRef.current -= 1;
    moveTrack(VPRef.current, stepRef.current);
    setTimeout(() => erase(screenRefs.current, fromIndex), ANIMATION_SPEED);
  }, []);

  const start = useCallback((currentScreenIndex: number) => {
    screenRefs.current.forEach((_, index) => {
      if (index !== 0 && index !== currentScreenIndex)
        erase(screenRefs.current, index);
    });
    stepRef.current = 0;
    moveTrack(VPRef.current, 0);
    setTimeout(
      () => erase(screenRefs.current, currentScreenIndex),
      ANIMATION_SPEED,
    );
  }, []);

  const eraseScreen = useCallback((index: number) => {
    erase(screenRefs.current, index);
  }, []);

  const jumpBack = useCallback((step: number, eraseIndex: number) => {
    stepRef.current = step;
    moveTrack(VPRef.current, step);
    setTimeout(() => erase(screenRefs.current, eraseIndex), ANIMATION_SPEED);
  }, []);

  const move = useMemo(
    () => ({ goForward, goBack, start, eraseScreen, jumpBack }),
    [],
  );

  return { VPRef, screenRefs, registerScreen, move };
};
