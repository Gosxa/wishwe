'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { centerRect, findAnchors, measureAnchors, placeCard } from './geometry';
import type { AnchorRect, CardPosition, TourStep } from './types';

const STEADY_FRAMES = 2;

type Measurement = {
  stepId?: string;
  rect: AnchorRect | null;
  frames: number;
};

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

const sameRect = (a: AnchorRect, b: AnchorRect) =>
  a.top === b.top &&
  a.left === b.left &&
  a.width === b.width &&
  a.height === b.height &&
  a.radius === b.radius;

const samePosition = (a: CardPosition, b: CardPosition) =>
  a.top === b.top &&
  a.left === b.left &&
  a.placement === b.placement &&
  a.arrow === b.arrow;

export const useTourLayout = (
  step: TourStep | undefined,
  cardRef: RefObject<HTMLElement | null>,
) => {
  const [rect, setRect] = useState<AnchorRect | null>(null);
  const [position, setPosition] = useState<CardPosition | null>(null);
  const [hasAnchor, setHasAnchor] = useState(false);
  const [isSteady, setIsSteady] = useState(false);
  const [laidOutStepId, setLaidOutStepId] = useState(step?.id);
  const measured = useRef<Measurement>({ rect: null, frames: 0 });

  if (step?.id !== laidOutStepId) {
    setLaidOutStepId(step?.id);
    setRect(null);
    setPosition(null);
    setHasAnchor(false);
    setIsSteady(false);
  }

  const sync = useCallback(() => {
    if (!step) return;

    const elements = findAnchors(step.anchor);

    setHasAnchor(elements.length > 0);

    const nextRect = elements.length
      ? measureAnchors(elements, step)
      : centerRect();

    const previous = measured.current;
    const held =
      previous.stepId === step.id &&
      previous.rect !== null &&
      sameRect(previous.rect, nextRect);
    const frames = held ? previous.frames + 1 : 0;

    measured.current = { stepId: step.id, rect: nextRect, frames };
    setIsSteady(frames >= STEADY_FRAMES);

    setRect(prev => (prev && sameRect(prev, nextRect) ? prev : nextRect));

    const card = cardRef.current;

    if (!card) return;

    const nextPosition = measureCardPosition(step, nextRect, card);

    setPosition(prev =>
      prev && samePosition(prev, nextPosition) ? prev : nextPosition,
    );
  }, [step, cardRef]);

  useEffect(() => {
    let frame = 0;

    const loop = () => {
      sync();
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frame);
  }, [sync]);

  return { rect, position, hasAnchor, isSteady };
};
