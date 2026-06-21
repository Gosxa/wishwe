'use client';

import { useEffect, useState } from 'react';
import {
  ConvertEventError,
  convertToPlan,
  listCategories,
} from '@/shared/client_api/event';
import type { BackendEvent, Category } from '@/shared/client_api/event';
import { useLoadingStore } from '@/shared/store/useLoadingStore';
import {
  getDateInputValue,
  getEventDateTimeErrors,
  getEventTimeInputMin,
} from '@/shared/lib/validation/eventDate';
import type { FieldErrors } from './types';

const UNLIMITED_MAX = 3000;

const fieldError = (value: unknown): string | undefined =>
  Array.isArray(value) && value.length > 0 ? String(value[0]) : undefined;

const errorBody = (body: Record<string, unknown>): Record<string, unknown> =>
  typeof body.error === 'object' && body.error !== null
    ? (body.error as Record<string, unknown>)
    : body;

const DRF_FIELD_MAP: Record<string, keyof FieldErrors> = {
  event_date: 'eventDate',
  event_time: 'eventTime',
  max_participants: 'maxParticipants',
};

export const usePlanIt = (event: BackendEvent, onConverted: () => void) => {
  const setLoading = useLoadingStore(s => s.setLoading);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [minParticipants, setMinParticipants] = useState(
    event.min_participants,
  );
  const [maxParticipants, setMaxParticipants] = useState(2);
  const [unlimited, setUnlimited] = useState(false);

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

  const clearMaxError = () =>
    setErrors(prev =>
      prev.maxParticipants || prev.submit
        ? { ...prev, maxParticipants: undefined, submit: undefined }
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

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};

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

    return next;
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
      await convertToPlan(String(event.id), {
        event_date: eventDate,
        event_time: eventTime,
        min_participants: minParticipants,
        max_participants: unlimited ? UNLIMITED_MAX : maxParticipants,
      });
      onConverted();
    } catch (e) {
      const body = e instanceof ConvertEventError ? errorBody(e.body) : {};
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
    category: {
      options: categories,
      selected: categoryId,
    },
    when: {
      date: eventDate,
      time: eventTime,
      minDate: getDateInputValue(),
      minTime: getEventTimeInputMin(eventDate),
      onDateChange: (value: string) => {
        setEventDate(value);
        applyDateTimeErrors(value, eventTime);
      },
      onTimeChange: (value: string) => {
        setEventTime(value);
        applyDateTimeErrors(eventDate, value);
      },
      dateError: errors.eventDate,
      timeError: errors.eventTime,
    },
    participants: {
      min: minParticipants,
      max: maxParticipants,
      unlimited,
      onMinChange: (value: number) => {
        setMinParticipants(value);
        clearMaxError();
      },
      onMaxChange: (value: number) => {
        setMaxParticipants(value);
        clearMaxError();
      },
      onUnlimitedChange: (value: boolean) => {
        setUnlimited(value);
        clearMaxError();
      },
      maxError: errors.maxParticipants,
    },
    submit: {
      onSubmit,
      isSubmitting,
      error: errors.submit,
    },
  };
};
