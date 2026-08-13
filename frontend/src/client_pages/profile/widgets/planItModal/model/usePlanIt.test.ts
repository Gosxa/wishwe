// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const eventApiMocks = vi.hoisted(() => ({
  convertToPlan: vi.fn(),
}));

vi.mock('@/shared/client_api/event', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/shared/client_api/event')>();

  return { ...actual, convertToPlan: eventApiMocks.convertToPlan };
});

import {
  type BackendEvent,
  ConvertEventError,
} from '@/shared/client_api/event';
import { useLoadingStore } from '@/shared/store/useLoadingStore';
import { usePlanIt } from './usePlanIt';

const futureDate = '2099-01-02';

const makeWish = (overrides: Partial<BackendEvent> = {}): BackendEvent => ({
  id: 42,
  creator: 'maya',
  creator_avatar: null,
  mutual_friend: null,
  category: 'Outdoors',
  event_type: 'wish',
  event_visibility: 'f-o-f',
  status: 'active',
  title: 'See the northern lights',
  description: 'A winter trip',
  cover_image: null,
  location: 'Norway',
  external_link: null,
  event_date: null,
  event_time: null,
  timeframe_text: 'Someday this winter',
  min_participants: 2,
  max_participants: null,
  participants_count: 1,
  interested_count: 3,
  participants_preview: [],
  created_at: '2026-01-01T12:00:00Z',
  is_full: false,
  available_spots: null,
  user_participation_status: null,
  ...overrides,
});

describe('usePlanIt', () => {
  const onConverted = vi.fn();
  const setLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    eventApiMocks.convertToPlan.mockResolvedValue(
      makeWish({
        event_type: 'plan',
      }),
    );
    useLoadingStore.setState({ isLoading: false, setLoading });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const renderPlanItHook = (event = makeWish()) =>
    renderHook(() => usePlanIt(event, onConverted));

  const fillValidSchedule = (
    result: ReturnType<typeof renderPlanItHook>['result'],
  ) => {
    act(() => {
      result.current.when.onDateChange(futureDate);
      result.current.when.onTimeChange('14:30');
      result.current.participants.onMinChange(3);
      result.current.participants.onMaxChange(5);
    });
  };

  it('initializes a new plan from the wish participant minimum', () => {
    const { result } = renderPlanItHook(makeWish({ min_participants: 4 }));

    expect(result.current.when.date).toBe('');
    expect(result.current.when.time).toBe('');
    expect(result.current.when.minDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.current.when.minTime).toBeUndefined();
    expect(result.current.participants).toMatchObject({
      min: 4,
      max: 2,
      unlimited: false,
      maxError: undefined,
    });
    expect(result.current.submit).toMatchObject({
      isSubmitting: false,
      error: undefined,
    });
  });

  it('reports both required schedule fields without starting a request', async () => {
    const { result } = renderPlanItHook();

    await act(async () => result.current.submit.onSubmit());

    expect(result.current.when.dateError).toBe('Date is required');
    expect(result.current.when.timeError).toBe('Time is required');
    expect(eventApiMocks.convertToPlan).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
    expect(onConverted).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: 'below the plan minimum',
      min: 1,
      max: 1,
      message: 'At least 2 participants',
    },
    {
      name: 'below the selected minimum',
      min: 5,
      max: 4,
      message: 'Max cannot be less than min',
    },
  ])('rejects a maximum $name', async ({ min, max, message }) => {
    const { result } = renderPlanItHook();

    act(() => {
      result.current.when.onDateChange(futureDate);
      result.current.when.onTimeChange('14:30');
      result.current.participants.onMinChange(min);
      result.current.participants.onMaxChange(max);
    });

    await act(async () => result.current.submit.onSubmit());

    expect(result.current.participants.maxError).toBe(message);
    expect(eventApiMocks.convertToPlan).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
  });

  it('validates past dates as they are edited and clears the error once valid', () => {
    const { result } = renderPlanItHook();

    act(() => result.current.when.onDateChange('2000-01-01'));

    expect(result.current.when.dateError).toBe('Date cannot be in the past');

    act(() => result.current.when.onDateChange(futureDate));

    expect(result.current.when.dateError).toBeUndefined();
  });

  it('sets and enforces the minimum time when the plan is scheduled today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 8, 12, 30));
    const { result } = renderPlanItHook();

    expect(result.current.when.minDate).toBe('2026-08-08');

    act(() => result.current.when.onDateChange('2026-08-08'));

    expect(result.current.when.minTime).toBe('12:30');

    act(() => result.current.when.onTimeChange('12:29'));

    expect(result.current.when.timeError).toBe('Time cannot be in the past');

    act(() => result.current.when.onTimeChange('12:30'));

    expect(result.current.when.timeError).toBeUndefined();
  });

  it('submits the selected schedule and restores the loading state', async () => {
    const { result } = renderPlanItHook();

    fillValidSchedule(result);

    await act(async () => result.current.submit.onSubmit());

    expect(eventApiMocks.convertToPlan).toHaveBeenCalledWith('42', {
      event_date: futureDate,
      event_time: '14:30',
      min_participants: 3,
      max_participants: 5,
    });
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
    expect(onConverted).toHaveBeenCalledOnce();
    expect(result.current.submit.isSubmitting).toBe(false);
    expect(result.current.submit.error).toBeUndefined();
  });

  it('uses the API unlimited sentinel instead of the hidden maximum', async () => {
    const { result } = renderPlanItHook();

    fillValidSchedule(result);
    act(() => {
      result.current.participants.onMaxChange(2);
      result.current.participants.onMinChange(999);
      result.current.participants.onUnlimitedChange(true);
    });

    await act(async () => result.current.submit.onSubmit());

    expect(eventApiMocks.convertToPlan).toHaveBeenCalledWith(
      '42',
      expect.objectContaining({
        min_participants: 999,
        max_participants: 3000,
      }),
    );
    expect(onConverted).toHaveBeenCalledOnce();
  });

  it('exposes the pending state until conversion settles', async () => {
    let resolveConversion!: (value: BackendEvent) => void;
    const conversion = new Promise<BackendEvent>(resolve => {
      resolveConversion = resolve;
    });

    eventApiMocks.convertToPlan.mockReturnValue(conversion);
    const { result } = renderPlanItHook();

    fillValidSchedule(result);

    let submission!: Promise<void>;

    act(() => {
      submission = result.current.submit.onSubmit();
    });

    expect(result.current.submit.isSubmitting).toBe(true);
    expect(setLoading).toHaveBeenCalledWith(true);
    expect(onConverted).not.toHaveBeenCalled();

    await act(async () => {
      resolveConversion(makeWish({ event_type: 'plan' }));
      await submission;
    });

    expect(result.current.submit.isSubmitting).toBe(false);
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
    expect(onConverted).toHaveBeenCalledOnce();
  });

  it('maps nested DRF field and form errors and always ends loading', async () => {
    eventApiMocks.convertToPlan.mockRejectedValue(
      new ConvertEventError({
        error: {
          event_date: ['Choose a later date.'],
          event_time: ['That time is unavailable.'],
          max_participants: ['Choose a larger maximum.'],
          non_field_errors: ['This wish cannot be converted.'],
        },
      }),
    );
    const { result } = renderPlanItHook();

    fillValidSchedule(result);

    await act(async () => result.current.submit.onSubmit());

    expect(result.current.when.dateError).toBe('Choose a later date.');
    expect(result.current.when.timeError).toBe('That time is unavailable.');
    expect(result.current.participants.maxError).toBe(
      'Choose a larger maximum.',
    );
    expect(result.current.submit.error).toBe('This wish cannot be converted.');
    expect(onConverted).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
    expect(result.current.submit.isSubmitting).toBe(false);
  });

  it('supports flat DRF errors and uses detail as the submit message', async () => {
    eventApiMocks.convertToPlan.mockRejectedValue(
      new ConvertEventError({
        event_time: ['The plan must start later.'],
        detail: 'Conversion rejected.',
      }),
    );
    const { result } = renderPlanItHook();

    fillValidSchedule(result);

    await act(async () => result.current.submit.onSubmit());

    expect(result.current.when.timeError).toBe('The plan must start later.');
    expect(result.current.submit.error).toBe('Conversion rejected.');
  });

  it('shows a safe fallback for unknown failures', async () => {
    eventApiMocks.convertToPlan.mockRejectedValue(
      new TypeError('Network down'),
    );
    const { result } = renderPlanItHook();

    fillValidSchedule(result);

    await act(async () => result.current.submit.onSubmit());

    expect(result.current.submit.error).toBe(
      'Something went wrong. Please try again.',
    );
    expect(onConverted).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('clears server errors when the corresponding values are changed', async () => {
    eventApiMocks.convertToPlan.mockRejectedValue(
      new ConvertEventError({
        error: {
          event_date: ['Choose another date.'],
          max_participants: ['Choose another maximum.'],
          non_field_errors: ['Review the form.'],
        },
      }),
    );
    const { result } = renderPlanItHook();

    fillValidSchedule(result);
    await act(async () => result.current.submit.onSubmit());

    act(() => result.current.when.onDateChange('2099-01-03'));

    expect(result.current.when.dateError).toBeUndefined();
    expect(result.current.submit.error).toBeUndefined();
    expect(result.current.participants.maxError).toBe(
      'Choose another maximum.',
    );

    act(() => result.current.participants.onMaxChange(6));

    expect(result.current.participants.maxError).toBeUndefined();
  });
});
