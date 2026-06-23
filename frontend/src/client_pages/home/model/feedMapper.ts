import { formatCategoryHashtag } from '@/shared/lib/formatCategoryName';
import { toAbsoluteMediaUrl } from '@/shared/lib/mediaUrl';
import type { BackendEvent } from '@/shared/client_api/event';
import type { FeedEvent } from './types';

export { toAbsoluteMediaUrl };

const fallbackCover = '/bg-gradient-noise.webp';

const eventImage = (coverImage: string | null) =>
  toAbsoluteMediaUrl(coverImage) ?? fallbackCover;

const handle = (username: string | null | undefined) =>
  username ? `@${username}` : '@someone';

export { handle };

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
      hashtag: event.category
        ? formatCategoryHashtag(event.category)
        : undefined,
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
      chatLink: event.external_link,
      participantCount:
        event.event_type === 'wish'
          ? event.interested_count
          : event.participants_count,
      maxParticipants: event.max_participants,
      participants: (event.participants_preview ?? []).map(participant => ({
        username: handle(participant.username),
        avatar: toAbsoluteMediaUrl(participant.avatar),
      })),
      userParticipationStatus: event.user_participation_status,
    };
  });
