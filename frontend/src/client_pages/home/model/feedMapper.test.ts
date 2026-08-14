import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BackendEvent } from '@/shared/client_api/event';

const environment = vi.hoisted(() => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  process.env.NEXT_PUBLIC_BACKEND_URL = 'https://api.wishwe.test/backend-path';

  return { backendUrl };
});

import { eventImage, handle, toFeedEvents } from './feedMapper';

const originalTimezone = process.env.TZ;

const restoreEnvironmentVariable = (
  name: 'NEXT_PUBLIC_BACKEND_URL' | 'TZ',
  value: string | undefined,
) => {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
};

const makeEvent = (overrides: Partial<BackendEvent> = {}): BackendEvent => ({
  id: 42,
  creator: 'alice',
  creator_avatar: '/media/avatars/alice.png',
  mutual_friend: { id: 7, username: 'dana' },
  category: 'Travel',
  event_type: 'plan',
  event_visibility: 'friends-only',
  status: 'active',
  title: 'Evening picnic',
  description: 'Bring a blanket',
  cover_image: '/media/covers/picnic.jpg',
  location: 'Riverside park',
  external_link: 'https://chat.wishwe.test/picnic',
  event_date: '2026-07-20',
  event_time: '18:05:00',
  timeframe_text: null,
  min_participants: 2,
  max_participants: 12,
  participants_count: 4,
  interested_count: 9,
  participants_preview: [
    { username: 'bob', avatar: '/media/avatars/bob.jpg' },
    { username: 'carol', avatar: null },
  ],
  created_at: '2026-07-01T12:34:56Z',
  is_full: false,
  available_spots: 8,
  user_participation_status: 'joined',
  ...overrides,
});

describe('feedMapper', () => {
  beforeEach(() => {
    process.env.TZ = 'UTC';
  });

  afterAll(() => {
    restoreEnvironmentVariable(
      'NEXT_PUBLIC_BACKEND_URL',
      environment.backendUrl,
    );
    restoreEnvironmentVariable('TZ', originalTimezone);
  });

  it('maps every plan field used by a feed card', () => {
    expect(toFeedEvents([makeEvent()])).toEqual([
      {
        id: '42',
        type: 'plan',
        hashtag: '#travel',
        image: 'https://api.wishwe.test/media/covers/picnic.jpg',
        title: 'Evening picnic',
        host: {
          username: '@alice',
          avatar: 'https://api.wishwe.test/media/avatars/alice.png',
          mutualFriend: '@dana',
        },
        date: 'Monday, July 20 @ 18:05',
        startsAt: Date.UTC(2026, 6, 20, 18, 5),
        createdAt: Date.parse('2026-07-01T12:34:56Z'),
        location: 'Riverside park',
        description: 'Bring a blanket',
        chatLink: 'https://chat.wishwe.test/picnic',
        participantCount: 4,
        maxParticipants: 12,
        participants: [
          {
            username: '@bob',
            avatar: 'https://api.wishwe.test/media/avatars/bob.jpg',
          },
          { username: '@carol', avatar: null },
        ],
        userParticipationStatus: 'joined',
      },
    ]);
  });

  it('uses wish-specific timeframe, interest count, and unlimited capacity', () => {
    const [wish] = toFeedEvents([
      makeEvent({
        event_type: 'wish',
        event_date: '2030-01-02',
        event_time: '09:30:00',
        timeframe_text: 'One day this winter',
        max_participants: null,
        cover_image: null,
        category: null,
        participants_count: 2,
        interested_count: 17,
        user_participation_status: 'interested',
      }),
    ]);

    expect(wish).toMatchObject({
      type: 'wish',
      hashtag: undefined,
      image: '/bg-gradient-noise.webp',
      date: 'One day this winter',
      startsAt: null,
      participantCount: 17,
      maxParticipants: null,
      userParticipationStatus: 'interested',
    });
  });

  it('supplies safe handles and nullable media for missing people', () => {
    const [event] = toFeedEvents([
      makeEvent({
        creator: null,
        creator_avatar: null,
        mutual_friend: null,
        participants_preview: [{ username: null, avatar: null }],
      }),
    ]);

    expect(event.host).toEqual({
      username: '@someone',
      avatar: null,
      mutualFriend: undefined,
    });
    expect(event.participants).toEqual([
      { username: '@someone', avatar: null },
    ]);
    expect(handle(undefined)).toBe('@someone');
  });

  it.each([null, '', '   '])(
    'uses the bundled cover when the API cover is %j',
    cover => {
      expect(eventImage(cover)).toBe('/bg-gradient-noise.webp');
    },
  );

  it('normalizes relative media and preserves browser-ready media URLs', () => {
    const [event] = toFeedEvents([
      makeEvent({
        cover_image: 'media/covers/no-leading-slash.jpg',
        creator_avatar: 'data:image/png;base64,avatar',
        participants_preview: [
          {
            username: 'bob',
            avatar: 'https://cdn.wishwe.test/bob.jpg',
          },
          {
            username: 'carol',
            avatar: '//cdn.wishwe.test/carol.jpg',
          },
        ],
      }),
    ]);

    expect(event.image).toBe(
      'https://api.wishwe.test/media/covers/no-leading-slash.jpg',
    );
    expect(event.host.avatar).toBe('data:image/png;base64,avatar');
    expect(event.participants.map(participant => participant.avatar)).toEqual([
      'https://cdn.wishwe.test/bob.jpg',
      '//cdn.wishwe.test/carol.jpg',
    ]);
  });

  it.each([
    ['UTC', Date.UTC(2026, 6, 20, 18, 5)],
    ['America/New_York', Date.UTC(2026, 6, 20, 22, 5)],
    ['Asia/Tokyo', Date.UTC(2026, 6, 20, 9, 5)],
  ])(
    'treats a plan date and time as local wall time in %s',
    (timezone, expectedTimestamp) => {
      process.env.TZ = timezone;

      const [event] = toFeedEvents([makeEvent()]);

      expect(event.date).toBe('Monday, July 20 @ 18:05');
      expect(event.startsAt).toBe(expectedTimestamp);
    },
  );
});
