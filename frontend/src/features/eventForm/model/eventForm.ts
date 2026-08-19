import { getEventDateTimeErrors } from '@/shared/lib/validation/eventDate';
import { mapApiFormErrors } from '@/shared/lib/api/formErrors';
import type { EventFormErrors, EventFormMode, EventFormValues } from './types';

export const UNLIMITED_PARTICIPANTS = 3000;

const API_FIELD_MAP = {
  category: 'category',
  title: 'title',
  location: 'location',
  description: 'description',
  event_date: 'eventDate',
  event_time: 'eventTime',
  min_participants: 'minParticipants',
  max_participants: 'maxParticipants',
  timeframe_text: 'timeframeText',
  external_link: 'chatLink',
  cover_image: 'cover',
} as const satisfies Record<string, Exclude<keyof EventFormErrors, 'submit'>>;

const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const validateEventForm = (
  values: EventFormValues,
  requireCategory: boolean,
): EventFormErrors => {
  const errors: EventFormErrors = {};

  if (requireCategory && !values.categoryId) {
    errors.category = 'Category is required';
  }

  if (!values.title.trim()) errors.title = 'Title is required';
  else if (values.title.trim().length > 50) {
    errors.title = 'Up to 50 characters';
  }

  if (!values.location.trim()) errors.location = 'Location is required';
  if (values.description.length > 200) {
    errors.description = 'Up to 200 characters';
  }

  if (values.type === 'plan') {
    if (!values.eventDate) errors.eventDate = 'Date is required';
    if (!values.eventTime) errors.eventTime = 'Time is required';
    Object.assign(
      errors,
      getEventDateTimeErrors(values.eventDate, values.eventTime),
    );

    if (!values.unlimited) {
      if (values.maxParticipants < 2) {
        errors.maxParticipants = 'At least 2 participants';
      } else if (values.maxParticipants < values.minParticipants) {
        errors.maxParticipants = 'Max cannot be less than min';
      }
    }

    if (values.chatLink.trim() && !isValidUrl(values.chatLink.trim())) {
      errors.chatLink = 'Enter a valid link (https://…)';
    }
  } else if (!values.timeframeText.trim()) {
    errors.timeframeText = 'Timeframe is required';
  }

  return errors;
};

export const hasRequiredEventFields = (values: EventFormValues): boolean => {
  const dateTimeErrors =
    values.type === 'plan'
      ? getEventDateTimeErrors(values.eventDate, values.eventTime)
      : {};

  return (
    Boolean(values.categoryId) &&
    values.title.trim().length > 0 &&
    values.location.trim().length > 0 &&
    (values.type === 'plan'
      ? Boolean(values.eventDate) &&
        Boolean(values.eventTime) &&
        !Object.values(dateTimeErrors).some(Boolean)
      : values.timeframeText.trim().length > 0)
  );
};

export const buildEventFields = (
  values: EventFormValues,
  mode: EventFormMode,
): Record<string, string | number> => {
  const fields: Record<string, string | number> = {
    title: values.title.trim(),
    location: values.location.trim(),
    min_participants: values.minParticipants,
  };

  if (mode === 'create') fields.event_visibility = values.visibility;
  if (values.categoryId != null) fields.category = values.categoryId;

  if (mode === 'edit' || values.description.trim()) {
    fields.description =
      mode === 'create' ? values.description.trim() : values.description;
  }

  if (values.type === 'plan') {
    fields.event_date = values.eventDate;
    fields.event_time = values.eventTime;
    fields.max_participants = values.unlimited
      ? UNLIMITED_PARTICIPANTS
      : values.maxParticipants;

    if (mode === 'edit' || values.chatLink.trim()) {
      fields.external_link = values.chatLink.trim();
    }
  } else {
    fields.timeframe_text = values.timeframeText.trim();
  }

  return fields;
};

export const buildEventPayload = (
  fields: Record<string, string | number>,
  coverFile: File | null,
): FormData | Record<string, unknown> => {
  if (!coverFile) return fields;

  const formData = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    formData.set(key, String(value));
  });
  formData.set('cover_image', coverFile);

  return formData;
};

export const mapEventFormErrors = (
  body: Record<string, unknown>,
): EventFormErrors => mapApiFormErrors(body, API_FIELD_MAP);
