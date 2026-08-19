'use client';

import { createEvent, CreateEventError } from '@/shared/client_api/event';
import type { BackendEventType } from '@/shared/client_api/event';
import { useEventForm } from '@/features/eventForm';

export const useCreateEvent = (
  onCreated: () => void,
  defaultType: BackendEventType = 'plan',
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
    onSuccess: onCreated,
  });
