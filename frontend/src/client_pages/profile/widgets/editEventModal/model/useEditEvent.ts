'use client';

import { updateEvent, UpdateEventError } from '@/shared/client_api/event';
import type { BackendEvent } from '@/shared/client_api/event';
import { UNLIMITED_PARTICIPANTS, useEventForm } from '@/features/eventForm';
import { toAbsoluteMediaUrl } from '@client_pages/home/model/feedMapper';

export const useEditEvent = (event: BackendEvent, onSaved: () => void) => {
  const isPlan = event.event_type === 'plan';
  const initialMax = event.max_participants ?? 2;
  const initialUnlimited = isPlan && initialMax >= UNLIMITED_PARTICIPANTS;

  return useEventForm({
    mode: 'edit',
    initialLocationPlaceId: event.location_place_id,
    initialValues: {
      type: event.event_type,
      categoryId: null,
      title: event.title,
      location: event.location,
      description: event.description,
      eventDate: event.event_date ?? '',
      eventTime: event.event_time?.slice(0, 5) ?? '',
      minParticipants: event.min_participants,
      maxParticipants: initialUnlimited ? 2 : initialMax,
      unlimited: initialUnlimited,
      timeframeText: event.timeframe_text ?? '',
      chatLink: event.external_link ?? '',
      visibility: 'f-o-f',
    },
    initialCategoryName: event.category,
    initialCoverUrl: toAbsoluteMediaUrl(event.cover_image),
    submitEvent: (_type, payload) =>
      updateEvent(String(event.id), event.event_type, payload),
    submitErrorBody: error =>
      error instanceof UpdateEventError ? error.body : {},
    onSuccess: onSaved,
  });
};
