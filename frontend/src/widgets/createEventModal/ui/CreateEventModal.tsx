'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { BackendEvent, BackendEventType } from '@/shared/client_api/event';
import { EventFormModal } from '@/features/eventForm';
import type { EventFormModel } from '@/features/eventForm';
import { useModalTransition } from '@shared/hooks/useModalTransition';
import {
  useOnboardingStore,
  type OnboardingField,
  type OnboardingFormBridge,
} from '@/shared/store/useOnboardingStore';
import { useCreatedEventShareStore } from '@/shared/store/useCreatedEventShareStore';
import { useCreateEvent } from '../model/useCreateEvent';
import {
  WishLaunchTransition,
  type WishLaunchState,
} from './WishLaunchTransition';

type Props = {
  onClose: () => void;
  onCreated: () => void;
  defaultType?: BackendEventType;
};

const FIELD_INPUT = {
  title: 'titleInput',
  location: 'locationInput',
  description: 'descriptionInput',
  timeframe: 'timeframeInput',
} as const satisfies Record<OnboardingField, keyof EventFormModel>;

const PUBLISHING_HOLD_MS = 1100;
const SUCCESS_HOLD_MS = 1400;
const REDUCED_MOTION_SUCCESS_HOLD_MS = 120;

const successHoldMs = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ? REDUCED_MOTION_SUCCESS_HOLD_MS
    : SUCCESS_HOLD_MS;

const toBridge = (form: EventFormModel): OnboardingFormBridge => ({
  isWish: !form.isPlan,
  categories: form.category.options,
  selectedCategoryId: form.category.selected,
  values: {
    title: form.titleInput.value,
    location: form.locationInput.value,
    description: form.descriptionInput.value,
    timeframe: form.timeframeInput.value,
  },
  canSubmit: form.hasRequiredFields && !form.submit.isSubmitting,
  chooseType: form.onTypeChange,
  chooseCategory: form.category.onChange,
  fill: (field, value) => form[FIELD_INPUT[field]].onChange(value),
});

const useOnboardingBridge = (form: EventFormModel) => {
  const isOnboarding = useOnboardingStore(state => state.step !== null);
  const syncForm = useOnboardingStore(state => state.syncForm);

  useEffect(() => {
    if (isOnboarding) syncForm(toBridge(form));
  });

  useEffect(() => () => syncForm(null), [syncForm]);
};

export const CreateEventModal = ({
  onClose,
  onCreated,
  defaultType,
}: Props) => {
  const isOnboarding = useOnboardingStore(state => state.step !== null);
  const reportCreated = useOnboardingStore(state => state.reportCreated);
  const openCreatedEventShare = useCreatedEventShareStore(state => state.open);
  const { requestClose, modalTransitionProps } = useModalTransition(onClose);
  const [launchState, setLaunchState] = useState<WishLaunchState>('idle');
  const pendingCreatedRef = useRef<BackendEvent | null>(null);
  const publishingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const publishingIsCompleteRef = useRef(false);
  const requestHasSettledRef = useRef(false);
  const launchIsActiveRef = useRef(false);

  const clearPublishingTimer = () => {
    if (publishingTimerRef.current) {
      clearTimeout(publishingTimerRef.current);
      publishingTimerRef.current = null;
    }
  };

  const clearSuccessTimer = () => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
  };

  const scheduleHandoff = () => {
    clearSuccessTimer();

    if (!pendingCreatedRef.current) return;

    successTimerRef.current = setTimeout(() => {
      const created = pendingCreatedRef.current;

      successTimerRef.current = null;
      pendingCreatedRef.current = null;

      if (!created) return;

      reportCreated(created);
      if (!isOnboarding) openCreatedEventShare(created);
      onCreated();
    }, successHoldMs());
  };

  const finishPublishing = () => {
    if (
      !launchIsActiveRef.current ||
      !publishingIsCompleteRef.current ||
      !requestHasSettledRef.current
    ) {
      return;
    }

    launchIsActiveRef.current = false;
    clearPublishingTimer();

    if (!pendingCreatedRef.current) {
      setLaunchState('idle');

      return;
    }

    setLaunchState('success');
    scheduleHandoff();
  };

  const handleSubmitStart = () => {
    clearPublishingTimer();
    clearSuccessTimer();
    pendingCreatedRef.current = null;
    publishingIsCompleteRef.current = false;
    requestHasSettledRef.current = false;
    launchIsActiveRef.current = true;
    setLaunchState('publishing');

    publishingTimerRef.current = setTimeout(() => {
      publishingTimerRef.current = null;
      publishingIsCompleteRef.current = true;
      finishPublishing();
    }, PUBLISHING_HOLD_MS);
  };

  const handleCreated = (created: BackendEvent) => {
    pendingCreatedRef.current = created;
  };

  const handleSubmitSettled = () => {
    requestHasSettledRef.current = true;
    finishPublishing();
  };

  const form = useCreateEvent(handleCreated, defaultType, {
    showGlobalLoader: false,
    onSubmitStart: handleSubmitStart,
    onSubmitSettled: handleSubmitSettled,
  });

  useOnboardingBridge(form);

  useEffect(
    () => () => {
      launchIsActiveRef.current = false;

      if (publishingTimerRef.current) {
        clearTimeout(publishingTimerRef.current);
      }

      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    },
    [],
  );

  return createPortal(
    <>
      <EventFormModal
        mode="create"
        form={form}
        onClose={requestClose}
        overlayProps={modalTransitionProps}
      />
      <WishLaunchTransition
        state={launchState}
        eventType={form.isPlan ? 'plan' : 'wish'}
        title={form.titleInput.value}
      />
    </>,
    document.body,
  );
};
