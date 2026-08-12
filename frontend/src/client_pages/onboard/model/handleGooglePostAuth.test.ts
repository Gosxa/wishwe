import { beforeEach, describe, expect, it, vi } from 'vitest';

const userApiMocks = vi.hoisted(() => ({
  acceptInvite: vi.fn(),
}));

vi.mock('@/shared/client_api/user', () => ({
  acceptInvite: userApiMocks.acceptInvite,
}));

import type { Profile } from '@/shared/client_api/auth/types';
import { handleGooglePostAuth } from './handleGooglePostAuth';
import { SCREEN_ID } from './screensConfig';

const profile = (username: string | null): Profile => ({
  id: 7,
  user: 'amy@example.com',
  user_id: 7,
  username,
  first_name: 'Amy',
  last_name: 'Lee',
  bio: null,
  date_of_birth: null,
  city: null,
  gender: null,
  avatar: 'https://cdn.example/amy.png',
  social_media_url: null,
  is_private: false,
  has_seen_feed_tour: false,
});

describe('handleGooglePostAuth', () => {
  const next = vi.fn();
  const navigateHome = vi.fn();
  const prefillGoogleProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    userApiMocks.acceptInvite.mockResolvedValue(undefined);
  });

  it('navigates an onboarded user home when there is no invite', async () => {
    const user = profile('amy');

    await handleGooglePostAuth({
      user,
      invite: null,
      next,
      navigateHome,
      prefillGoogleProfile,
    });

    expect(navigateHome).toHaveBeenCalledOnce();
    expect(prefillGoogleProfile).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('prefills profile details for a new Google user', async () => {
    const user = profile(null);

    await handleGooglePostAuth({
      user,
      invite: null,
      next,
      navigateHome,
      prefillGoogleProfile,
    });

    expect(prefillGoogleProfile).toHaveBeenCalledWith(user);
    expect(next).toHaveBeenCalledWith(SCREEN_ID.PERSONAL_GOOGLE);
    expect(navigateHome).not.toHaveBeenCalled();
  });

  it('accepts an invite for an onboarded user before confirming it', async () => {
    const user = profile('amy');

    await handleGooglePostAuth({
      user,
      invite: { token: 'invite-token', username: 'sam' },
      next,
      navigateHome,
      prefillGoogleProfile,
    });

    expect(userApiMocks.acceptInvite).toHaveBeenCalledWith('invite-token');
    expect(next).toHaveBeenCalledWith(SCREEN_ID.INVITE_REQUEST_SENT);
    expect(navigateHome).not.toHaveBeenCalled();
  });

  it('defers invite acceptance until a new Google user has a username', async () => {
    const user = profile(null);

    await handleGooglePostAuth({
      user,
      invite: { token: 'invite-token' },
      next,
      navigateHome,
      prefillGoogleProfile,
    });

    expect(userApiMocks.acceptInvite).not.toHaveBeenCalled();
    expect(prefillGoogleProfile).toHaveBeenCalledWith(user);
    expect(next).toHaveBeenCalledWith(SCREEN_ID.PERSONAL_GOOGLE);
  });

  it('propagates invite acceptance failures to the calling hook', async () => {
    const failure = new Error('invite failed');

    userApiMocks.acceptInvite.mockRejectedValueOnce(failure);

    await expect(
      handleGooglePostAuth({
        user: profile('amy'),
        invite: { token: 'invite-token' },
        next,
        navigateHome,
        prefillGoogleProfile,
      }),
    ).rejects.toBe(failure);

    expect(next).not.toHaveBeenCalled();
  });
});
