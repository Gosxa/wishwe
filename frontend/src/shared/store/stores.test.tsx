// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Profile } from '@/shared/client_api/auth/types';
import { UserStoreInitializer } from './UserStoreInitializer';
import { useCreateEventStore } from './useCreateEventStore';
import { useEventModalStore } from './useEventModalStore';
import { useEventsRefreshStore } from './useEventsRefreshStore';
import { useLoadingStore } from './useLoadingStore';
import { useUserStore } from './useUserStore';

const profile: Profile = {
  id: 7,
  user: 'amy@example.com',
  user_id: 7,
  username: 'amy',
  first_name: 'Amy',
  last_name: 'Lee',
  bio: null,
  date_of_birth: null,
  city: null,
  gender: null,
  avatar: null,
  social_media_url: null,
  is_private: false,
  has_seen_feed_tour: false,
};

describe('shared Zustand stores', () => {
  beforeEach(() => {
    useCreateEventStore.setState({ isOpen: false, defaultType: 'plan' });
    useEventModalStore.setState({ eventId: null });
    useEventsRefreshStore.setState({
      refreshToken: 0,
      isDeferred: false,
      isPending: false,
      revealEventId: null,
    });
    useLoadingStore.setState({ isLoading: false });
    useUserStore.setState({ user: null });
  });

  afterEach(cleanup);

  it('opens and closes the create-event modal with the requested type', () => {
    useCreateEventStore.getState().open('wish');

    expect(useCreateEventStore.getState()).toMatchObject({
      defaultType: 'wish',
      isOpen: true,
    });

    useCreateEventStore.getState().close();

    expect(useCreateEventStore.getState()).toMatchObject({
      defaultType: 'wish',
      isOpen: false,
    });

    useCreateEventStore.getState().open();

    expect(useCreateEventStore.getState()).toMatchObject({
      defaultType: 'plan',
      isOpen: true,
    });
  });

  it('opens, replaces, and closes the selected event modal', () => {
    useEventModalStore.getState().open('first');
    expect(useEventModalStore.getState().eventId).toBe('first');

    useEventModalStore.getState().open('second');
    expect(useEventModalStore.getState().eventId).toBe('second');

    useEventModalStore.getState().close();
    expect(useEventModalStore.getState().eventId).toBeNull();
  });

  it('increments the event refresh token for every request', () => {
    useEventsRefreshStore.getState().requestRefresh();
    useEventsRefreshStore.getState().requestRefresh();

    expect(useEventsRefreshStore.getState().refreshToken).toBe(2);
  });

  it('holds deferred refresh requests until they are flushed', () => {
    useEventsRefreshStore.getState().deferRefresh();
    useEventsRefreshStore.getState().requestRefresh();
    useEventsRefreshStore.getState().requestRefresh();

    expect(useEventsRefreshStore.getState().refreshToken).toBe(0);

    useEventsRefreshStore.getState().flushRefresh();

    expect(useEventsRefreshStore.getState().refreshToken).toBe(1);
    expect(useEventsRefreshStore.getState().isDeferred).toBe(false);
  });

  it('flushes without refreshing when nothing was requested', () => {
    useEventsRefreshStore.getState().deferRefresh();
    useEventsRefreshStore.getState().flushRefresh();
    useEventsRefreshStore.getState().flushRefresh();

    expect(useEventsRefreshStore.getState().refreshToken).toBe(0);
  });

  it('keeps the event to reveal until the flushed refresh delivers it', () => {
    useEventsRefreshStore.getState().deferRefresh('7');
    useEventsRefreshStore.getState().requestRefresh();
    useEventsRefreshStore.getState().flushRefresh();

    expect(useEventsRefreshStore.getState().revealEventId).toBe('7');

    useEventsRefreshStore.getState().clearReveal();

    expect(useEventsRefreshStore.getState().revealEventId).toBeNull();
  });

  it('drops the event to reveal when no refresh was requested', () => {
    useEventsRefreshStore.getState().deferRefresh('7');
    useEventsRefreshStore.getState().flushRefresh();

    expect(useEventsRefreshStore.getState().revealEventId).toBeNull();
  });

  it('sets and clears the global loading state', () => {
    useLoadingStore.getState().setLoading(true);
    expect(useLoadingStore.getState().isLoading).toBe(true);

    useLoadingStore.getState().setLoading(false);
    expect(useLoadingStore.getState().isLoading).toBe(false);
  });

  it('sets and clears the current user', () => {
    useUserStore.getState().setUser(profile);
    expect(useUserStore.getState().user).toEqual(profile);

    useUserStore.getState().clearUser();
    expect(useUserStore.getState().user).toBeNull();
  });

  it('hydrates the user store and follows initializer prop changes', () => {
    const { rerender } = render(<UserStoreInitializer user={profile} />);

    expect(useUserStore.getState().user).toEqual(profile);

    const updatedProfile = {
      ...profile,
      first_name: 'Amelia',
      has_seen_feed_tour: true,
    };

    rerender(<UserStoreInitializer user={updatedProfile} />);

    expect(useUserStore.getState().user).toEqual(updatedProfile);
  });
});
