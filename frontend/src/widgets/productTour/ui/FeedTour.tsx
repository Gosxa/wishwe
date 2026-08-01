'use client';

import { useEffect, useRef, useState } from 'react';
import { markFeedTourSeen } from '@/shared/client_api/user';
import { useUserStore } from '@/shared/store/useUserStore';
import { buildFeedTourSteps } from '../model/feedTourSteps';
import { isStepAvailable } from '../model/geometry';
import type { TourStep } from '../model/types';
import { ProductTour } from './ProductTour';

const DESKTOP_QUERY = '(min-width: 1024px)';

const storageKey = (profileId: number) => `wishwe:feed-tour-seen:${profileId}`;

const FEED_READY_SELECTOR = '[data-tour="feed-card"], [data-tour="feed-empty"]';
const FEED_POLL_MS = 120;
const FEED_TIMEOUT_MS = 8000;

const hasSeenLocally = (profileId: number) => {
  try {
    return window.localStorage.getItem(storageKey(profileId)) === '1';
  } catch {
    return false;
  }
};

const rememberLocally = (profileId: number) => {
  try {
    window.localStorage.setItem(storageKey(profileId), '1');
  } catch {
    // _
  }
};

export const FeedTour = () => {
  const user = useUserStore(state => state.user);
  const setUser = useUserStore(state => state.setUser);
  const [steps, setSteps] = useState<TourStep[] | null>(null);
  const startedRef = useRef(false);

  const profileId = user?.id ?? null;
  const isFirstVisit = user?.has_seen_feed_tour === false;
  const name = user?.first_name || user?.username;

  useEffect(() => {
    if (startedRef.current || !isFirstVisit || profileId === null) return;
    if (!window.matchMedia(DESKTOP_QUERY).matches) return;
    if (hasSeenLocally(profileId)) return;

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const isFeedReady = document.querySelector(FEED_READY_SELECTOR) !== null;

      if (!isFeedReady && Date.now() - startedAt < FEED_TIMEOUT_MS) return;

      window.clearInterval(timer);
      startedRef.current = true;
      setSteps(buildFeedTourSteps(name).filter(isStepAvailable));
    }, FEED_POLL_MS);

    return () => window.clearInterval(timer);
  }, [isFirstVisit, name, profileId]);

  if (!steps || !user) return null;

  const handleEnd = () => {
    setSteps(null);
    rememberLocally(user.id);
    setUser({ ...user, has_seen_feed_tour: true });

    markFeedTourSeen().catch(() => {});
  };

  return <ProductTour steps={steps} onEnd={handleEnd} />;
};
