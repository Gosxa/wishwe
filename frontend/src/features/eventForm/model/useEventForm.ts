'use client';

import { useEffect, useState } from 'react';
import type { BackendEventType, Category } from '@/shared/client_api/event';
import { listCategories } from '@/shared/client_api/event';
import { useLoadingStore } from '@/shared/store/useLoadingStore';
import {
  getDateInputValue,
  getEventDateTimeErrors,
  getEventTimeInputMin,
} from '@/shared/lib/validation/eventDate';
import {
  isAllowedCoverImage,
  MAX_COVER_IMAGE_SIZE,
  prepareCoverImage,
} from '@/shared/lib/validation/imageUpload';
import {
  buildEventFields,
  buildEventPayload,
  hasRequiredEventFields,
  mapEventFormErrors,
  validateEventForm,
} from './eventForm';
import type {
  EventFormErrors,
  EventFormMode,
  EventFormModel,
  EventFormValues,
} from './types';

type Options = {
  mode: EventFormMode;
  initialValues: EventFormValues;
  initialCategoryName?: string | null;
  initialCoverUrl?: string | null;
  resetType?: BackendEventType;
  submitEvent: (
    type: BackendEventType,
    payload: FormData | Record<string, unknown>,
  ) => Promise<unknown>;
  submitErrorBody: (error: unknown) => Record<string, unknown>;
  onSuccess: (created: unknown) => void;
  onSubmitStart?: () => void;
  onSubmitSettled?: () => void;
  showGlobalLoader?: boolean;
};

export const useEventForm = ({
  mode,
  initialValues,
  initialCategoryName,
  initialCoverUrl = null,
  resetType,
  submitEvent,
  submitErrorBody,
  onSuccess,
  onSubmitStart,
  onSubmitSettled,
  showGlobalLoader = true,
}: Options): EventFormModel => {
  const setLoading = useLoadingStore(state => state.setLoading);
  const [values, setValues] = useState(initialValues);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(initialCoverUrl);
  const [errors, setErrors] = useState<EventFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparingCover, setIsPreparingCover] = useState(false);
  const [previousResetType, setPreviousResetType] = useState(resetType);

  if (resetType !== previousResetType) {
    setPreviousResetType(resetType);
    setValues(current => ({ ...current, type: resetType ?? current.type }));
    setErrors({});
  }

  useEffect(() => {
    let isActive = true;

    listCategories()
      .then(data => {
        if (!isActive) return;

        setCategories(data);

        if (initialCategoryName !== undefined) {
          setValues(current => ({
            ...current,
            categoryId:
              data.find(category => category.name === initialCategoryName)
                ?.id ?? null,
          }));
        }
      })
      .catch(() => {
        if (!isActive) return;

        setErrors(current => ({
          ...current,
          category: 'Failed to load categories. Please try again.',
        }));
      });

    return () => {
      isActive = false;
    };
  }, [initialCategoryName]);

  useEffect(
    () => () => {
      if (coverPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    },
    [coverPreviewUrl],
  );

  const clearError = (key: keyof EventFormErrors) => {
    setErrors(current =>
      current[key] || current.submit
        ? { ...current, [key]: undefined, submit: undefined }
        : current,
    );
  };

  const updateValue = <Key extends keyof EventFormValues>(
    key: Key,
    value: EventFormValues[Key],
    errorKey?: keyof EventFormErrors,
  ) => {
    setValues(current => ({ ...current, [key]: value }));
    if (errorKey) clearError(errorKey);
  };

  const applyDateTimeErrors = (eventDate: string, eventTime: string) => {
    setErrors(current => ({
      ...current,
      eventDate: undefined,
      eventTime: undefined,
      submit: undefined,
      ...getEventDateTimeErrors(eventDate, eventTime),
    }));
  };

  const onCoverSelect = async (file: File) => {
    setCoverFile(null);

    if (!isAllowedCoverImage(file)) {
      setErrors(current => ({
        ...current,
        cover: 'Unsupported image format',
      }));

      return;
    }

    if (file.size > MAX_COVER_IMAGE_SIZE) {
      setErrors(current => ({
        ...current,
        cover: 'Image must be 5 MB or less',
      }));

      return;
    }

    setIsPreparingCover(true);

    try {
      const preparedFile = await prepareCoverImage(file);

      if (preparedFile.size > MAX_COVER_IMAGE_SIZE) {
        setErrors(current => ({
          ...current,
          cover: 'Converted image must be 5 MB or less',
        }));

        return;
      }

      setCoverFile(preparedFile);
      setCoverPreviewUrl(URL.createObjectURL(preparedFile));
      clearError('cover');
    } catch {
      setErrors(current => ({
        ...current,
        cover: 'Could not process this image',
      }));
    } finally {
      setIsPreparingCover(false);
    }
  };

  const onSubmit = async () => {
    const validationErrors = validateEventForm(values, mode === 'create');

    if (Object.values(validationErrors).some(Boolean)) {
      setErrors(validationErrors);

      return;
    }

    setErrors({});
    onSubmitStart?.();
    setIsSubmitting(true);
    if (showGlobalLoader) {
      setLoading(true);
    }

    try {
      const fields = buildEventFields(values, mode);
      const payload = buildEventPayload(fields, coverFile);

      const created = await submitEvent(values.type, payload);

      onSuccess(created);
    } catch (error) {
      setErrors(mapEventFormErrors(submitErrorBody(error)));
    } finally {
      setIsSubmitting(false);
      onSubmitSettled?.();
      if (showGlobalLoader) {
        setLoading(false);
      }
    }
  };

  const isPlan = values.type === 'plan';

  return {
    isPlan,
    onTypeChange: type => {
      setValues(current => ({ ...current, type }));
      setErrors({});
    },
    category: {
      options: categories,
      selected: values.categoryId,
      onChange: id => updateValue('categoryId', id, 'category'),
      error: errors.category,
    },
    titleInput: {
      value: values.title,
      onChange: value => updateValue('title', value, 'title'),
      error: errors.title,
    },
    locationInput: {
      value: values.location,
      onChange: value => updateValue('location', value, 'location'),
      error: errors.location,
    },
    descriptionInput: {
      value: values.description,
      onChange: value => updateValue('description', value, 'description'),
      error: errors.description,
    },
    dateInput: {
      value: values.eventDate,
      min: getDateInputValue(),
      onChange: value => {
        setValues(current => ({ ...current, eventDate: value }));
        applyDateTimeErrors(value, values.eventTime);
      },
      error: errors.eventDate,
    },
    timeInput: {
      value: values.eventTime,
      min: getEventTimeInputMin(values.eventDate),
      onChange: value => {
        setValues(current => ({ ...current, eventTime: value }));
        applyDateTimeErrors(values.eventDate, value);
      },
      error: errors.eventTime,
    },
    participants: {
      min: values.minParticipants,
      max: values.maxParticipants,
      unlimited: values.unlimited,
      onMinChange: value =>
        updateValue('minParticipants', value, 'maxParticipants'),
      onMaxChange: value =>
        updateValue('maxParticipants', value, 'maxParticipants'),
      onUnlimitedChange: value =>
        updateValue('unlimited', value, 'maxParticipants'),
      minError: errors.minParticipants,
      maxError: errors.maxParticipants,
    },
    timeframeInput: {
      value: values.timeframeText,
      onChange: value => updateValue('timeframeText', value, 'timeframeText'),
      error: errors.timeframeText,
    },
    chatLinkInput: {
      value: values.chatLink,
      onChange: value => updateValue('chatLink', value, 'chatLink'),
      error: errors.chatLink,
    },
    visibility: {
      value: values.visibility,
      onChange: value => updateValue('visibility', value),
    },
    cover: {
      previewUrl: coverPreviewUrl,
      onSelect: onCoverSelect,
      error: errors.cover,
      isProcessing: isPreparingCover,
    },
    hasRequiredFields: hasRequiredEventFields(values),
    submit: {
      onSubmit,
      isSubmitting,
      error: errors.submit,
    },
  };
};
