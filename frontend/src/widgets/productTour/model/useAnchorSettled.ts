'use client';

import { useEffect, useState } from 'react';
import { findAnchors } from './geometry';
import type { TourStep } from './types';

const GRACE_MS = 1600;

const SCROLL_INTO_VIEW: ScrollIntoViewOptions = {
  block: 'nearest',
  inline: 'nearest',
  behavior: 'smooth',
};

export const useAnchorSettled = (
  step: TourStep | undefined,
  hasAnchor: boolean,
  isSteady: boolean,
) => {
  const [isExpired, setIsExpired] = useState(false);
  const [timedStepId, setTimedStepId] = useState(step?.id);

  if (step?.id !== timedStepId) {
    setTimedStepId(step?.id);
    setIsExpired(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setIsExpired(true), GRACE_MS);

    return () => window.clearTimeout(timer);
  }, [step?.id]);

  useEffect(() => {
    if (!hasAnchor || !step) return;

    findAnchors(step.anchor)[0]?.scrollIntoView(SCROLL_INTO_VIEW);
  }, [hasAnchor, step]);

  return !step?.anchor || (hasAnchor && isSteady) || isExpired;
};
