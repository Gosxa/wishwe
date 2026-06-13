export type EventVisibility = 'friends-only' | 'f-o-f';

export type FieldErrors = {
  category?: string;
  title?: string;
  location?: string;
  description?: string;
  eventDate?: string;
  eventTime?: string;
  minParticipants?: string;
  maxParticipants?: string;
  timeframeText?: string;
  cover?: string;
  submit?: string;
};
