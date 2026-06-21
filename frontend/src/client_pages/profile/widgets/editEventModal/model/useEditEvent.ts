'use client';

import { useEffect, useState } from 'react';
import {
  listCategories,
  updateEvent,
  UpdateEventError,
} from '@/shared/client_api/event';
import type { BackendEvent, Category } from '@/shared/client_api/event';
import { useLoadingStore } from '@/shared/store/useLoadingStore';
import {
  getDateInputValue,
  getEventDateTimeErrors,
  getEventTimeInputMin,
} from '@/shared/lib/validation/eventDate';
import { toAbsoluteMediaUrl } from '@client_pages/home/model/feedMapper';
import type { FieldErrors } from './types';

const ALLOWED_COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_COVER_SIZE = 5 * 1024 * 1024;
const UNLIMITED_MAX = 3000;

const fieldError = (value: unknown): string | undefined =>
  Array.isArray(value) && value.length > 0 ? String(value[0]) : undefined;

const errorBody = (body: Record<string, unknown>): Record<string, unknown> =>
  typeof body.error === 'object' && body.error !== null
    ? (body.error as Record<string, unknown>)
    : body;

const isValidUrl = (value: string): boolean => {
  try {
    new URL(value);

    return true;
  } catch {
    return false;
  }
};

const DRF_FIELD_MAP: Record<string, keyof FieldErrors> = {
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
};

export const useEditEvent = (event: BackendEvent, onSaved: () => void) => {
  const setLoading = useLoadingStore(s => s.setLoading);

  const isPlan = event.event_type === 'plan';

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const [title, setTitle] = useState(event.title);
  const [location, setLocation] = useState(event.location);
  const [description, setDescription] = useState(event.description);
  const [eventDate, setEventDate] = useState(event.event_date ?? '');
  const [eventTime, setEventTime] = useState(
    event.event_time?.slice(0, 5) ?? '',
  );
  const [minParticipants, setMinParticipants] = useState(
    event.min_participants,
  );
  const initialMax = event.max_participants ?? 2;
  const initialUnlimited = isPlan && initialMax >= UNLIMITED_MAX;
  const [maxParticipants, setMaxParticipants] = useState(
    initialUnlimited ? 2 : initialMax,
  );
  const [unlimited, setUnlimited] = useState(initialUnlimited);
  const [timeframeText, setTimeframeText] = useState(
    event.timeframe_text ?? '',
  );
  const [chatLink, setChatLink] = useState(event.external_link ?? '');

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(
    toAbsoluteMediaUrl(event.cover_image),
  );

  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    listCategories()
      .then(data => {
        if (!isActive) return;

        setCategories(data);
        setCategoryId(
          data.find(category => category.name === event.category)?.id ?? null,
        );
      })
      .catch(() => {});

    return () => {
      isActive = false;
    };
  }, [event.category]);

  useEffect(
    () => () => {
      if (coverPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    },
    [coverPreviewUrl],
  );

  const clearError = (key: keyof FieldErrors) =>
    setErrors(prev =>
      prev[key] || prev.submit
        ? { ...prev, [key]: undefined, submit: undefined }
        : prev,
    );

  const applyDateTimeErrors = (nextDate: string, nextTime: string) => {
    setErrors(prev => ({
      ...prev,
      eventDate: undefined,
      eventTime: undefined,
      submit: undefined,
      ...getEventDateTimeErrors(nextDate, nextTime),
    }));
  };

  const onCoverSelect = (file: File) => {
    if (!ALLOWED_COVER_TYPES.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        cover: 'Supported formats: PNG, JPG, and WebP',
      }));

      return;
    }

    if (file.size > MAX_COVER_SIZE) {
      setErrors(prev => ({ ...prev, cover: 'Image must be 5 MB or less' }));

      return;
    }

    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
    clearError('cover');
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};

    if (!title.trim()) next.title = 'Title is required';
    else if (title.length > 50) next.title = 'Up to 50 characters';

    if (!location.trim()) next.location = 'Location is required';

    if (description.length > 200) next.description = 'Up to 200 characters';

    if (isPlan) {
      if (!eventDate) next.eventDate = 'Date is required';
      if (!eventTime) next.eventTime = 'Time is required';
      Object.assign(next, getEventDateTimeErrors(eventDate, eventTime));

      if (!unlimited) {
        if (maxParticipants < 2) {
          next.maxParticipants = 'At least 2 participants';
        } else if (maxParticipants < minParticipants) {
          next.maxParticipants = 'Max cannot be less than min';
        }
      }

      if (chatLink.trim() && !isValidUrl(chatLink.trim())) {
        next.chatLink = 'Enter a valid link (https://…)';
      }
    } else if (!timeframeText.trim()) {
      next.timeframeText = 'Timeframe is required';
    }

    return next;
  };

  const buildFields = (): Record<string, string | number> => {
    const fields: Record<string, string | number> = {
      title: title.trim(),
      description,
      location: location.trim(),
      min_participants: minParticipants,
    };

    if (categoryId != null) fields.category = categoryId;

    if (isPlan) {
      fields.event_date = eventDate;
      fields.event_time = eventTime;
      fields.max_participants = unlimited ? UNLIMITED_MAX : maxParticipants;
      fields.external_link = chatLink.trim();
    } else {
      fields.timeframe_text = timeframeText.trim();
    }

    return fields;
  };

  const onSubmit = async () => {
    const validationErrors = validate();

    if (Object.values(validationErrors).some(Boolean)) {
      setErrors(validationErrors);

      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setLoading(true);

    try {
      const fields = buildFields();
      let payload: FormData | Record<string, unknown> = fields;

      if (coverFile) {
        const formData = new FormData();

        Object.entries(fields).forEach(([key, value]) => {
          formData.set(key, String(value));
        });
        formData.set('cover_image', coverFile);
        payload = formData;
      }

      await updateEvent(String(event.id), event.event_type, payload);
      onSaved();
    } catch (e) {
      const body = e instanceof UpdateEventError ? errorBody(e.body) : {};
      const next: FieldErrors = {};

      Object.entries(DRF_FIELD_MAP).forEach(([drfKey, formKey]) => {
        const message = fieldError(body[drfKey]);

        if (message) next[formKey] = message;
      });

      next.submit =
        fieldError(body.non_field_errors) ??
        (typeof body.detail === 'string' ? body.detail : undefined) ??
        (Object.values(next).some(Boolean)
          ? undefined
          : 'Something went wrong. Please try again.');

      setErrors(next);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return {
    isPlan,
    category: {
      options: categories,
      selected: categoryId,
      onChange: (id: number | null) => {
        setCategoryId(id);
        clearError('category');
      },
      error: errors.category,
    },
    titleInput: {
      value: title,
      onChange: (value: string) => {
        setTitle(value);
        clearError('title');
      },
      error: errors.title,
    },
    locationInput: {
      value: location,
      onChange: (value: string) => {
        setLocation(value);
        clearError('location');
      },
      error: errors.location,
    },
    descriptionInput: {
      value: description,
      onChange: (value: string) => {
        setDescription(value);
        clearError('description');
      },
      error: errors.description,
    },
    dateInput: {
      value: eventDate,
      min: getDateInputValue(),
      onChange: (value: string) => {
        setEventDate(value);
        applyDateTimeErrors(value, eventTime);
      },
      error: errors.eventDate,
    },
    timeInput: {
      value: eventTime,
      min: getEventTimeInputMin(eventDate),
      onChange: (value: string) => {
        setEventTime(value);
        applyDateTimeErrors(eventDate, value);
      },
      error: errors.eventTime,
    },
    participants: {
      min: minParticipants,
      max: maxParticipants,
      unlimited,
      onMinChange: (value: number) => {
        setMinParticipants(value);
        clearError('maxParticipants');
      },
      onMaxChange: (value: number) => {
        setMaxParticipants(value);
        clearError('maxParticipants');
      },
      onUnlimitedChange: (value: boolean) => {
        setUnlimited(value);
        clearError('maxParticipants');
      },
      minError: errors.minParticipants,
      maxError: errors.maxParticipants,
    },
    timeframeInput: {
      value: timeframeText,
      onChange: (value: string) => {
        setTimeframeText(value);
        clearError('timeframeText');
      },
      error: errors.timeframeText,
    },
    chatLinkInput: {
      value: chatLink,
      onChange: (value: string) => {
        setChatLink(value);
        clearError('chatLink');
      },
      error: errors.chatLink,
    },
    cover: {
      previewUrl: coverPreviewUrl,
      onSelect: onCoverSelect,
      error: errors.cover,
    },
    submit: {
      onSubmit,
      isSubmitting,
      error: errors.submit,
    },
  };
};
