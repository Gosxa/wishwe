'use client';

import { useCallback, useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { centerRect, findAnchors, measureAnchors, placeCard } from './geometry';
import type { AnchorRect, CardPosition, TourStep } from './types';

const measureCardPosition = (
  step: TourStep,
  rect: AnchorRect,
  card: HTMLElement,
): CardPosition => {
  const { width, height } = card.getBoundingClientRect();
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  if (step.anchor) {
    return placeCard(
      rect,
      { width, height },
      step.placement ?? 'bottom',
      viewport,
    );
  }

  return {
    top: (viewport.height - height) / 2,
    left: (viewport.width - width) / 2,
    placement: 'bottom',
    arrow: -1,
  };
};

export const useTourLayout = (
  step: TourStep | undefined,
  cardRef: RefObject<HTMLElement | null>,
) => {
  const [rect, setRect] = useState<AnchorRect | null>(null);
  const [position, setPosition] = useState<CardPosition | null>(null);

  const sync = useCallback(() => {
    if (!step) return;

    const elements = findAnchors(step.anchor);
    const nextRect = elements.length
      ? measureAnchors(elements, step)
      : centerRect();

    setRect(nextRect);

    const card = cardRef.current;

    if (!card) return;

    setPosition(measureCardPosition(step, nextRect, card));
  }, [step, cardRef]);

  useEffect(() => {
    let frame = 0;

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    };

    schedule();

    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);

    const observer = new ResizeObserver(schedule);

    observer.observe(document.body);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      observer.disconnect();
    };
  }, [sync]);

  return { rect, position };
};
