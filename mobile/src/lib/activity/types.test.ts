import { describe, expect, it } from 'vitest';

import { formatRelativeTime, mapNotification } from '@/lib/activity/types';
import type { BackendNotification } from '@/lib/api/notifications';

describe('formatRelativeTime', () => {
  const baseNow = new Date('2026-09-08T15:30:00Z');

  it('formats recent events as just now', () => {
    const recent = new Date('2026-09-08T15:29:30Z');
    expect(formatRelativeTime(recent, baseNow)).toBe('just now');
  });

  it('formats minutes ago', () => {
    const oneMinAgo = new Date('2026-09-08T15:29:00Z');
    expect(formatRelativeTime(oneMinAgo, baseNow)).toBe('1 minute ago');

    const tenMinAgo = new Date('2026-09-08T15:20:00Z');
    expect(formatRelativeTime(tenMinAgo, baseNow)).toBe('10 minutes ago');
  });

  it('formats hours ago', () => {
    const oneHourAgo = new Date('2026-09-08T14:30:00Z');
    expect(formatRelativeTime(oneHourAgo, baseNow)).toBe('1 hour ago');

    const twoHoursAgo = new Date('2026-09-08T13:30:00Z');
    expect(formatRelativeTime(twoHoursAgo, baseNow)).toBe('2 hours ago');
  });

  it('formats days ago', () => {
    const oneDayAgo = new Date('2026-09-07T15:30:00Z');
    expect(formatRelativeTime(oneDayAgo, baseNow)).toBe('1 day ago');

    const threeDaysAgo = new Date('2026-09-05T15:30:00Z');
    expect(formatRelativeTime(threeDaysAgo, baseNow)).toBe('3 days ago');
  });

  it('formats weeks ago', () => {
    const oneWeekAgo = new Date('2026-09-01T15:30:00Z');
    expect(formatRelativeTime(oneWeekAgo, baseNow)).toBe('1 week ago');

    const twoWeeksAgo = new Date('2026-08-25T15:30:00Z');
    expect(formatRelativeTime(twoWeeksAgo, baseNow)).toBe('2 weeks ago');
  });

  it('formats months and years ago', () => {
    const twoMonthsAgo = new Date('2026-07-08T15:30:00Z');
    expect(formatRelativeTime(twoMonthsAgo, baseNow)).toBe('2 months ago');

    const oneYearAgo = new Date('2025-08-01T15:30:00Z');
    expect(formatRelativeTime(oneYearAgo, baseNow)).toBe('1 year ago');
  });

  it('returns empty string for invalid date', () => {
    expect(formatRelativeTime('not-a-date', baseNow)).toBe('');
  });
});

describe('mapNotification', () => {
  const baseNow = new Date('2026-09-08T15:30:00Z');

  it('maps backend notification to activity item', () => {
    const backendNotification: BackendNotification = {
      id: 42,
      title: 'Joined Event',
      message: 'Sonia Vovk joined your plan: Tennis. Only 1 spot left!',
      type: 'joined_event',
      recipient: 'current_user',
      creator: 'sonia',
      related_object_type: 'event',
      related_object_id: 101,
      is_read: false,
      created_at: '2026-09-07T15:30:00Z',
    };

    const item = mapNotification(backendNotification, baseNow);

    expect(item).toEqual({
      id: 42,
      title: 'Joined Event',
      message: 'Sonia Vovk joined your plan: Tennis. Only 1 spot left!',
      type: 'joined_event',
      recipient: 'current_user',
      creator: 'sonia',
      relatedObjectType: 'event',
      relatedObjectId: 101,
      isRead: false,
      createdAt: '2026-09-07T15:30:00Z',
      timeAgo: '1 day ago',
    });
  });

  it('maps friendship notification to activity item', () => {
    const friendshipNotification: BackendNotification = {
      id: 55,
      title: 'New friend request',
      message: 'New friend request: Alex Reed wants to see your plans and wishes',
      type: 'friend_request',
      recipient: 'current_user',
      creator: 'alex',
      related_object_type: 'friendship',
      related_object_id: 12,
      is_read: true,
      created_at: '2026-09-03T15:30:00Z',
    };

    const item = mapNotification(friendshipNotification, baseNow);

    expect(item).toEqual({
      id: 55,
      title: 'New friend request',
      message: 'New friend request: Alex Reed wants to see your plans and wishes',
      type: 'friend_request',
      recipient: 'current_user',
      creator: 'alex',
      relatedObjectType: 'friendship',
      relatedObjectId: 12,
      isRead: true,
      createdAt: '2026-09-03T15:30:00Z',
      timeAgo: '5 days ago',
    });
  });
});
