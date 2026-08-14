import { describe, expect, it } from 'vitest';
import {
  getDateInputValue,
  getEventDateTimeErrors,
  getEventTimeInputMin,
  getFutureEventDateTimeError,
  getTimeInputValue,
} from './eventDate';

const now = new Date(2026, 7, 14, 9, 5, 59);

describe('event date input formatting', () => {
  it('formats local calendar values with zero-padded date and time parts', () => {
    expect(getDateInputValue(now)).toBe('2026-08-14');
    expect(getTimeInputValue(now)).toBe('09:05');
  });

  it('sets a minimum time only when the selected date is today', () => {
    expect(getEventTimeInputMin('2026-08-14', now)).toBe('09:05');
    expect(getEventTimeInputMin('2026-08-13', now)).toBeUndefined();
    expect(getEventTimeInputMin('2026-08-15', now)).toBeUndefined();
    expect(getEventTimeInputMin('', now)).toBeUndefined();
  });
});

describe('getFutureEventDateTimeError', () => {
  it('leaves required-field validation to the form when no date is set', () => {
    expect(getFutureEventDateTimeError('', '08:00', now)).toBeUndefined();
  });

  it('rejects every date before the current local calendar date', () => {
    expect(getFutureEventDateTimeError('2026-08-13', '23:59', now)).toEqual({
      field: 'date',
      message: 'Date cannot be in the past',
    });
  });

  it('rejects an earlier minute on today and maps it to the time field', () => {
    expect(getFutureEventDateTimeError('2026-08-14', '09:04', now)).toEqual({
      field: 'time',
      message: 'Time cannot be in the past',
    });
    expect(getEventDateTimeErrors('2026-08-14', '09:04', now)).toEqual({
      eventTime: 'Time cannot be in the past',
    });
  });

  it('allows the current minute, a later minute, and any time tomorrow', () => {
    expect(
      getFutureEventDateTimeError('2026-08-14', '09:05', now),
    ).toBeUndefined();
    expect(
      getFutureEventDateTimeError('2026-08-14', '09:06', now),
    ).toBeUndefined();
    expect(
      getFutureEventDateTimeError('2026-08-15', '00:00', now),
    ).toBeUndefined();
  });

  it('does not add a boundary error before the required time is entered', () => {
    expect(getFutureEventDateTimeError('2026-08-14', '', now)).toBeUndefined();
    expect(getEventDateTimeErrors('2026-08-14', '', now)).toEqual({});
  });

  it('maps a past date error to the event date field', () => {
    expect(getEventDateTimeErrors('2026-08-13', '23:59', now)).toEqual({
      eventDate: 'Date cannot be in the past',
    });
  });
});
