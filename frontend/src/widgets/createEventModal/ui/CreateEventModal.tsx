'use client';

import { useEffect } from 'react';
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
import { useCreateEvent } from '../model/useCreateEvent';

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
  const reportCreated = useOnboardingStore(state => state.reportCreated);
  const { requestClose, requestCloseWith, modalTransitionProps } =
    useModalTransition(onClose);

  const handleCreated = (created: BackendEvent) => {
    reportCreated(created);
    requestCloseWith(onCreated);
  };

  const form = useCreateEvent(handleCreated, defaultType);

  useOnboardingBridge(form);

  return createPortal(
    <EventFormModal
      mode="create"
      form={form}
      onClose={requestClose}
      overlayProps={modalTransitionProps}
    />,
    document.body,
  );
};
