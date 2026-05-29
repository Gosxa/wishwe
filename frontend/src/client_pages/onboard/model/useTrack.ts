'use client';

import { useCallback, useMemo, useRef } from 'react';

const ANIMATION_SPEED = 300;
const SCREEN_PLUS_GAP = 440;

type Screens = (HTMLElement | null)[];

const summon = (screens: Screens, index: number) => {
  const el = screens[index];

  if (!el) {
    return;
  }

  el.style.display = 'flex';
  el.removeAttribute('inert');
};

const erase = (screens: Screens, index: number) => {
  const el = screens[index];

  if (!el) {
    return;
  }

  el.style.display = 'none';
  el.setAttribute('inert', '');
};

const moveTrack = (track: HTMLElement | null, step: number) => {
  if (!track) {
    return;
  }

  // eslint-disable-next-line no-param-reassign
  track.style.transform = `translateX(-${step * SCREEN_PLUS_GAP}px)`;
};

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

  const summonScreen = useCallback((index: number) => {
    summon(screenRefs.current, index);
  }, []);

  const jumpBack = useCallback((step: number, eraseIndex: number) => {
    stepRef.current = step;
    moveTrack(VPRef.current, step);
    setTimeout(() => erase(screenRefs.current, eraseIndex), ANIMATION_SPEED);
  }, []);

  const revealScreen = useCallback(
    (summonIndex: number, eraseIndex: number) => {
      const trackEl = VPRef.current;

      if (!trackEl) return;

      summon(screenRefs.current, summonIndex);

      const nextStep = stepRef.current + 1;

      trackEl.style.transition = 'none';
      trackEl.style.transform = `translateX(-${nextStep * SCREEN_PLUS_GAP}px)`;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          trackEl.style.transition = `transform ${ANIMATION_SPEED}ms ease`;
          moveTrack(trackEl, stepRef.current);

          setTimeout(() => {
            erase(screenRefs.current, eraseIndex);
            trackEl.style.transition = '';
          }, ANIMATION_SPEED);
        });
      });
    },
    [],
  );

  const move = useMemo(
    () => ({
      goForward,
      goBack,
      start,
      eraseScreen,
      summonScreen,
      jumpBack,
      revealScreen,
    }),
    [],
  );

  return { VPRef, screenRefs, registerScreen, move };
};
