'use client';

import { markFeedTourSeen } from '@/shared/client_api/user';
import { useUserStore } from '@/shared/store/useUserStore';
import { rememberLocally } from '../model/feedTourStorage';
import { useFeedTourSteps } from '../model/useFeedTourSteps';
import { ProductTour } from './ProductTour';

export const FeedTour = () => {
  const user = useUserStore(state => state.user);
  const setUser = useUserStore(state => state.setUser);

  const profileId = user?.id ?? null;
  const isFirstVisit = user?.has_seen_feed_tour === false;
  const name = user?.first_name || user?.username;

  const { steps, close } = useFeedTourSteps(profileId, isFirstVisit, name);

  if (!steps || !user) return null;

  const handleEnd = () => {
    close();
    rememberLocally(user.id);
    setUser({ ...user, has_seen_feed_tour: true });

    markFeedTourSeen().catch(() => {});
  };

  return <ProductTour steps={steps} onEnd={handleEnd} />;
};
