type FutureEventDateTimeError =
  | { field: 'date'; message: string }
  | { field: 'time'; message: string };

const pad = (value: number) => String(value).padStart(2, '0');

export const getDateInputValue = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const getTimeInputValue = (date = new Date()) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;

export const getEventTimeInputMin = (eventDate: string, now = new Date()) =>
  eventDate === getDateInputValue(now) ? getTimeInputValue(now) : undefined;

export const getFutureEventDateTimeError = (
  eventDate: string,
  eventTime: string,
  now = new Date(),
): FutureEventDateTimeError | undefined => {
  if (!eventDate) return undefined;

  const today = getDateInputValue(now);

  if (eventDate < today) {
    return { field: 'date', message: 'Date cannot be in the past' };
  }

  if (eventTime && eventDate === today && eventTime < getTimeInputValue(now)) {
    return { field: 'time', message: 'Time cannot be in the past' };
  }

  return undefined;
};

export const getEventDateTimeErrors = (
  eventDate: string,
  eventTime: string,
  now = new Date(),
): { eventDate?: string; eventTime?: string } => {
  const error = getFutureEventDateTimeError(eventDate, eventTime, now);

  if (!error) return {};

  return error.field === 'date'
    ? { eventDate: error.message }
    : { eventTime: error.message };
};
