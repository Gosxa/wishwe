'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';

const MODAL_CONTENT_SELECTOR = '[data-modal-content]';

const pulseKeyframes: Keyframe[] = [
  { transform: 'scale(1)' },
  { transform: 'scale(1.015)', offset: 0.5 },
  { transform: 'scale(1)' },
];

const pulseOptions: KeyframeAnimationOptions = {
  duration: 360,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

export const useModalAttention = () => {
  const animationRef = useRef<Animation | null>(null);

  useEffect(
    () => () => {
      animationRef.current?.cancel();
    },
    [],
  );

  return useCallback((event: MouseEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;

    event.stopPropagation();

    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const modal = event.currentTarget.querySelector<HTMLElement>(
      MODAL_CONTENT_SELECTOR,
    );

    if (!modal || typeof modal.animate !== 'function') return;

    animationRef.current?.cancel();
    animationRef.current = modal.animate(pulseKeyframes, pulseOptions);
  }, []);
};
