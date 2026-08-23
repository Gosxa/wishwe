'use client';

import { useEffect, useRef } from 'react';
import { useOnboardingStore } from '@/shared/store/useOnboardingStore';
import { hasSeenLocally } from './feedTourStorage';
import { waitForFeed } from './waitForFeed';

const DESKTOP_QUERY = '(min-width: 1024px)';

const shouldStartTour = (profileId: number | null, isFirstVisit: boolean) => {
  if (!isFirstVisit || profileId === null) return false;
  if (!window.matchMedia(DESKTOP_QUERY).matches) return false;

  return !hasSeenLocally(profileId);
};

export const useOnboardingStart = (
  profileId: number | null,
  isFirstVisit: boolean,
) => {
  const begin = useOnboardingStore(state => state.begin);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !shouldStartTour(profileId, isFirstVisit)) {
      return;
    }

    return waitForFeed(() => {
      startedRef.current = true;
      begin();
    });
  }, [begin, isFirstVisit, profileId]);
};
