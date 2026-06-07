import type { BackendEvent } from '@/shared/client_api/event';
import type { FeedEvent } from './types';

const cover = (label: string) =>
  `https://placehold.co/640x400/e8e4d8/8a9199.png?text=${encodeURIComponent(label)}`;

const fallbackCover = cover('No image provided');
const apiBaseURL = process.env.NEXT_PUBLIC_API_URL ?? '';

const apiOrigin = (() => {
  try {
    return apiBaseURL ? new URL(apiBaseURL).origin : '';
  } catch {
    return '';
  }
})();

const toAbsoluteMediaUrl = (path: string | null | undefined): string | null => {
  const value = path?.trim();

  if (!value) {
    return null;
  }

  if (/^(https?:)?\/\//.test(value)) {
    return value;
  }

  if (apiOrigin) {
    return `${apiOrigin}/${value.replace(/^\/+/, '')}`;
  }

  return value;
};

const eventImage = (coverImage: string | null) =>
  toAbsoluteMediaUrl(coverImage) ?? fallbackCover;

const handle = (username: string | null | undefined) =>
  username ? `@${username}` : '@someone';

const eventStartDate = (event: BackendEvent): Date | null => {
  if (event.event_type === 'wish' || !event.event_date) return null;

  return new Date(
    event.event_time
      ? `${event.event_date}T${event.event_time}`
      : event.event_date,
  );
};

const formatEventDate = (event: BackendEvent, when: Date | null): string => {
  if (!when) {
    return event.timeframe_text ?? '';
  }

  const day = when.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (!event.event_time) {
    return day;
  }

  const time = when.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${day} @ ${time}`;
};

export const toFeedEvents = (events: BackendEvent[]): FeedEvent[] =>
  events.map(event => {
    const startDate = eventStartDate(event);

    return {
      id: String(event.id),
      type: event.event_type,
      hashtag: event.category ? `#${event.category}` : undefined,
      image: eventImage(event.cover_image),
      title: event.title,
      host: {
        username: handle(event.creator),
        avatar: toAbsoluteMediaUrl(event.creator_avatar),
        mutualFriend: event.mutual_friend
          ? handle(event.mutual_friend.username)
          : undefined,
      },
      date: formatEventDate(event, startDate),
      startsAt: startDate?.getTime() ?? null,
      createdAt: new Date(event.created_at).getTime(),
      location: event.location,
      description: event.description,
      participantCount:
        event.event_type === 'wish'
          ? event.interested_count
          : event.participants_count,
      participants: (event.participants_preview ?? []).map(participant => ({
        username: handle(participant.username),
        avatar: toAbsoluteMediaUrl(participant.avatar),
      })),
    };
  });
