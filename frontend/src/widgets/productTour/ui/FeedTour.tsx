'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { markFeedTourSeen } from '@/shared/client_api/user';
import { formatCategoryDisplayName } from '@/shared/lib/formatCategoryName';
import { useUserStore } from '@/shared/store/useUserStore';
import {
  useOnboardingStore,
  type OnboardingField,
  type OnboardingStep,
} from '@/shared/store/useOnboardingStore';
import { rememberLocally } from '../model/feedTourStorage';
import { pickOnboardingCategory } from '../model/onboardingCategory';
import { buildOnboardingSteps } from '../model/onboardingSteps';
import { useOnboardingStart } from '../model/useOnboardingStart';
import type { TourStep } from '../model/types';
import { ProductTour } from './ProductTour';

const REQUIRED_FIELD: Partial<Record<OnboardingStep, OnboardingField>> = {
  title: 'title',
  location: 'location',
  timeframe: 'timeframe',
};

export const FeedTour = () => {
  const user = useUserStore(state => state.user);
  const setUser = useUserStore(state => state.setUser);

  const step = useOnboardingStore(state => state.step);
  const form = useOnboardingStore(state => state.form);
  const createdEvent = useOnboardingStore(state => state.createdEvent);
  const advance = useOnboardingStore(state => state.advance);
  const endTour = useOnboardingStore(state => state.end);

  useOnboardingStart(user?.id ?? null, user?.has_seen_feed_tour === false);

  const category = useMemo(
    () => pickOnboardingCategory(form?.categories ?? []),
    [form?.categories],
  );

  const steps = useMemo(
    () =>
      buildOnboardingSteps({
        name: user?.first_name || user?.username,
        categoryName: category?.name,
        categoryLabel: category
          ? formatCategoryDisplayName(category.name)
          : undefined,
      }),
    [category, user?.first_name, user?.username],
  );

  const finish = useCallback(() => {
    endTour();

    if (!user) return;

    rememberLocally(user.id);
    setUser({ ...user, has_seen_feed_tour: true });
    markFeedTourSeen().catch(() => {});
  }, [endTour, setUser, user]);

  const isSharing = step === 'share' || step === 'done';

  useEffect(() => {
    if (isSharing && !createdEvent) finish();
  }, [createdEvent, finish, isSharing]);

  const handleQuickFill = useCallback(
    (tourStep: TourStep) => {
      if (!tourStep.quickFill) return;

      form?.fill(tourStep.id as OnboardingField, tourStep.quickFill.value);
      advance();
    },
    [advance, form],
  );

  if (!user || !step) return null;

  const index = steps.findIndex(item => item.id === step);

  if (index < 0) return null;

  const requiredField = REQUIRED_FIELD[step];
  const nextDisabled = requiredField
    ? !form?.values[requiredField].trim()
    : false;

  return (
    <ProductTour
      steps={steps}
      index={index}
      nextDisabled={nextDisabled}
      onNext={advance}
      onQuickFill={handleQuickFill}
      onEnd={finish}
    />
  );
};
