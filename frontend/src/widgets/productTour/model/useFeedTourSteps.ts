'use client';

import { useEffect, useRef, useState } from 'react';
import { buildFeedTourSteps } from './feedTourSteps';
import { hasSeenLocally } from './feedTourStorage';
import { isStepAvailable } from './geometry';
import type { TourStep } from './types';
import { waitForFeed } from './waitForFeed';

const DESKTOP_QUERY = '(min-width: 1024px)';

const shouldStartTour = (profileId: number | null, isFirstVisit: boolean) => {
  if (!isFirstVisit || profileId === null) return false;
  if (!window.matchMedia(DESKTOP_QUERY).matches) return false;

  return !hasSeenLocally(profileId);
};

export const useFeedTourSteps = (
  profileId: number | null,
  isFirstVisit: boolean,
  name?: string | null,
) => {
  const [steps, setSteps] = useState<TourStep[] | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !shouldStartTour(profileId, isFirstVisit)) {
      return;
    }

    return waitForFeed(() => {
      startedRef.current = true;
      setSteps(buildFeedTourSteps(name).filter(isStepAvailable));
    });
  }, [isFirstVisit, name, profileId]);

  return { steps, close: () => setSteps(null) };
};
