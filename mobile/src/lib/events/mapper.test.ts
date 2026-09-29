import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/config', () => ({ API_URL: 'http://localhost:8000' }));

const { toFeedEvent } = await import('@/lib/events/mapper');

type BackendEvent = Parameters<typeof toFeedEvent>[0];

function makeEvent(overrides: Partial<BackendEvent> = {}): BackendEvent {
  return {
    id: 7,
    uuid: 'e8a54b94-2812-4f03-b709-d6a76f42e7d5',
    creator: 'anastasiiabb',
    creator_avatar: 'media/avatars/a.jpg',
    mutual_friend: null,
    category: 'Games',
    event_type: 'plan',
    event_visibility: 'friends_only',
    status: 'active',
    title: 'Board games night',
    description: 'Bringing classic board games.',
    cover_image: 'media/covers/board.jpg',
    location: 'my place (m. Kontraktova)',
    external_link: 'https://chat.example/board',
    event_date: '2026-04-17',
    event_time: '19:00:00',
    timeframe_text: null,
    min_participants: 2,
    max_participants: 20,
    participants_count: 3,
    interested_count: 0,
    participants_preview: [{ username: 'alex.w', avatar: null }],
    created_at: '2026-04-01T10:00:00Z',
    is_full: false,
    available_spots: 17,
    user_participation_status: 'joined',
    ...overrides,
  };
}

describe('toFeedEvent', () => {
  it('maps a plan with its date, hashtag and absolute media urls', () => {
    const event = toFeedEvent(makeEvent());

    expect(event.id).toBe('e8a54b94-2812-4f03-b709-d6a76f42e7d5');
    expect(event.type).toBe('plan');
    expect(event.hashtag).toBe('#games');
    expect(event.host.username).toBe('@anastasiiabb');
    expect(event.host.avatar).toBe('http://localhost:8000/media/avatars/a.jpg');
    expect(event.image).toBe('http://localhost:8000/media/covers/board.jpg');
    expect(event.date).toBe('Friday, April 17 @ 19:00');
    expect(event.startsAt).not.toBeNull();
    expect(event.userParticipationStatus).toBe('joined');
  });

  it('uses the free-text timeframe for wishes and counts interest', () => {
    const event = toFeedEvent(
      makeEvent({
        event_type: 'wish',
        event_date: null,
        event_time: null,
        timeframe_text: 'May or early June',
        participants_count: 0,
        interested_count: 4,
        user_participation_status: 'interested',
      }),
    );

    expect(event.date).toBe('May or early June');
    expect(event.startsAt).toBeNull();
    expect(event.participantCount).toBe(4);
  });

  it('falls back to a placeholder handle and null media', () => {
    const event = toFeedEvent(
      makeEvent({ creator: null, creator_avatar: null, cover_image: null, category: null }),
    );

    expect(event.host.username).toBe('@someone');
    expect(event.host.avatar).toBeNull();
    expect(event.image).toBeNull();
    expect(event.hashtag).toBeUndefined();
  });

  it('surfaces the mutual friend that makes the event visible', () => {
    const event = toFeedEvent(
      makeEvent({ mutual_friend: { id: 3, username: 'hello.sonia' } }),
    );

    expect(event.host.mutualFriend).toBe('@hello.sonia');
  });

  it('keeps absolute media urls untouched', () => {
    const event = toFeedEvent(makeEvent({ cover_image: 'https://cdn.example/x.jpg' }));

    expect(event.image).toBe('https://cdn.example/x.jpg');
  });
});
