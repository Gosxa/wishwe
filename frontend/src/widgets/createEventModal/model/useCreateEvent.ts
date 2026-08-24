'use client';

import { createEvent, CreateEventError } from '@/shared/client_api/event';
import type { BackendEvent, BackendEventType } from '@/shared/client_api/event';
import { useEventForm } from '@/features/eventForm';

type Options = {
  showGlobalLoader?: boolean;
  onSubmitStart?: () => void;
  onSubmitSettled?: () => void;
};

export const useCreateEvent = (
  onCreated: (event: BackendEvent) => void,
  defaultType: BackendEventType = 'plan',
  options: Options = {},
) =>
  useEventForm({
    mode: 'create',
    initialValues: {
      type: defaultType,
      categoryId: null,
      title: '',
      location: '',
      description: '',
      eventDate: '',
      eventTime: '',
      minParticipants: 1,
      maxParticipants: 2,
      unlimited: true,
      timeframeText: '',
      chatLink: '',
      visibility: 'f-o-f',
    },
    resetType: defaultType,
    submitEvent: createEvent,
    submitErrorBody: error =>
      error instanceof CreateEventError ? error.body : {},
    onSuccess: created => onCreated(created as BackendEvent),
    onSubmitStart: options.onSubmitStart,
    onSubmitSettled: options.onSubmitSettled,
    showGlobalLoader: options.showGlobalLoader,
  });
