'use client';

import { useEffect, useState } from 'react';
import {
  createEvent,
  CreateEventError,
  listCategories,
} from '@/shared/client_api/event';
import type { BackendEventType, Category } from '@/shared/client_api/event';
import { useLoadingStore } from '@/shared/store/useLoadingStore';
import type { EventVisibility, FieldErrors } from './types';

const UNLIMITED_MAX = 3000;
const ALLOWED_COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_COVER_SIZE = 5 * 1024 * 1024;

const fieldError = (value: unknown): string | undefined =>
  Array.isArray(value) && value.length > 0 ? String(value[0]) : undefined;

const errorBody = (body: Record<string, unknown>): Record<string, unknown> =>
  typeof body.error === 'object' && body.error !== null
    ? (body.error as Record<string, unknown>)
    : body;

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
  cover_image: 'cover',
};

export const useCreateEvent = (
  onCreated: () => void,
  defaultType: BackendEventType = 'plan',
) => {
  const setLoading = useLoadingStore(s => s.setLoading);

  const [type, setType] = useState<BackendEventType>(defaultType);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [minParticipants, setMinParticipants] = useState(1);
  const [maxParticipants, setMaxParticipants] = useState(2);
  const [unlimited, setUnlimited] = useState(true);
  const [timeframeText, setTimeframeText] = useState('');
  const [visibility, setVisibility] = useState<EventVisibility>('friends-only');

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPlan = type === 'plan';

  const [prevDefaultType, setPrevDefaultType] = useState(defaultType);

  if (defaultType !== prevDefaultType) {
    setPrevDefaultType(defaultType);
    setType(defaultType);
    setErrors({});
  }

  useEffect(() => {
    let isActive = true;

    listCategories()
      .then(data => {
        if (isActive) setCategories(data);
      })
      .catch(() => {});

    return () => {
      isActive = false;
    };
  }, []);

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

    if (!categoryId) next.category = 'Category is required';

    if (!title.trim()) next.title = 'Title is required';
    else if (title.length > 50) next.title = 'Up to 50 characters';

    if (!location.trim()) next.location = 'Location is required';

    if (description.length > 200) next.description = 'Up to 200 characters';

    if (isPlan) {
      if (!eventDate) next.eventDate = 'Date is required';
      if (!eventTime) next.eventTime = 'Time is required';

      if (!unlimited) {
        if (maxParticipants < 2) {
          next.maxParticipants = 'At least 2 participants';
        } else if (maxParticipants < minParticipants) {
          next.maxParticipants = 'Max cannot be less than min';
        }
      }
    } else if (!timeframeText.trim()) {
      next.timeframeText = 'Timeframe is required';
    }

    return next;
  };

  const canShare =
    Boolean(categoryId) &&
    title.trim().length > 0 &&
    location.trim().length > 0 &&
    (isPlan
      ? Boolean(eventDate) && Boolean(eventTime)
      : timeframeText.trim().length > 0);

  const buildFields = (): Record<string, string | number> => {
    const fields: Record<string, string | number> = {
      title: title.trim(),
      location: location.trim(),
      min_participants: minParticipants,
      event_visibility: visibility,
    };

    if (categoryId != null) fields.category = categoryId;
    if (description.trim()) fields.description = description.trim();

    if (isPlan) {
      fields.event_date = eventDate;
      fields.event_time = eventTime;
      fields.max_participants = unlimited ? UNLIMITED_MAX : maxParticipants;
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

      await createEvent(type, payload);
      onCreated();
    } catch (e) {
      const body = e instanceof CreateEventError ? errorBody(e.body) : {};
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
    type,
    isPlan,
    onTypeChange: (next: BackendEventType) => {
      setType(next);
      setErrors({});
    },
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
      onChange: (value: string) => {
        setEventDate(value);
        clearError('eventDate');
      },
      error: errors.eventDate,
    },
    timeInput: {
      value: eventTime,
      onChange: (value: string) => {
        setEventTime(value);
        clearError('eventTime');
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
    visibility: {
      value: visibility,
      onChange: (value: EventVisibility) => setVisibility(value),
    },
    cover: {
      previewUrl: coverPreviewUrl,
      onSelect: onCoverSelect,
      error: errors.cover,
    },
    canShare,
    submit: {
      onSubmit,
      isSubmitting,
      error: errors.submit,
    },
  };
};
