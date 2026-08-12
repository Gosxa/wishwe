import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useUserStore } from '@/shared/store/useUserStore';
import { handleUnauthorized } from './handleResponse';

const profile = {
  id: 1,
  user: 'person@example.com',
  user_id: 1,
  username: 'person',
  first_name: 'Test',
  last_name: 'Person',
  bio: null,
  date_of_birth: null,
  city: null,
  gender: null,
  avatar: null,
  social_media_url: null,
  is_private: false,
  has_seen_feed_tour: false,
} as const;

describe('handleUnauthorized', () => {
  beforeEach(() => {
    useUserStore.setState({ user: profile });
    vi.stubGlobal('window', { location: { href: '/current-page' } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ignores responses other than 401', () => {
    handleUnauthorized({ status: 403 } as Response);

    expect(useUserStore.getState().user).toEqual(profile);
    expect(window.location.href).toBe('/current-page');
  });

  it('clears the user, redirects to onboarding, and stops the request', () => {
    expect(() => handleUnauthorized({ status: 401 } as Response)).toThrow(
      'Unauthorized',
    );

    expect(useUserStore.getState().user).toBeNull();
    expect(window.location.href).toBe('/onboard');
  });
});
