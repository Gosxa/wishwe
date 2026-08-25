// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Profile } from '@/shared/client_api/auth/types';
import { PATHNAME_HEADER } from '@/shared/lib/nextPath';

const mocks = vi.hoisted(() => ({
  authUser: vi.fn(),
  headers: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  storeInit: vi.fn(),
}));

vi.mock('@/app/_server/auth/getMe', () => ({ authUser: mocks.authUser }));

vi.mock('next/headers', () => ({ headers: mocks.headers }));

vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

vi.mock('@/shared/store/UserStoreInitializer', () => ({
  UserStoreInitializer: ({ user }: { user: Profile }) => {
    mocks.storeInit(user);

    return <div data-testid="user-store-initializer">{user.username}</div>;
  },
}));

vi.mock('./EventModalHost', () => ({
  EventModalHost: () => <div data-testid="event-modal-host" />,
}));

vi.mock('./CreatedEventShareHost', () => ({
  CreatedEventShareHost: () => <div data-testid="created-event-share-host" />,
}));

import UserLayout from './layout';

const profile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 1,
  user: 'ann@example.com',
  user_id: 7,
  username: 'ann',
  first_name: 'Ann',
  last_name: null,
  bio: null,
  date_of_birth: null,
  city: null,
  gender: null,
  avatar: null,
  social_media_url: null,
  is_private: false,
  has_seen_feed_tour: true,
  ...overrides,
});

const child = <div data-testid="child">protected content</div>;

const setPathname = (value?: string) =>
  mocks.headers.mockResolvedValue(
    new Headers(value === undefined ? undefined : { [PATHNAME_HEADER]: value }),
  );

const renderLayout = async () => render(await UserLayout({ children: child }));

describe('(protected)/layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setPathname();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders children, hydrates the user store, and mounts the global modal host', async () => {
    const user = profile();

    mocks.authUser.mockResolvedValue(user);

    await renderLayout();

    expect(screen.getByTestId('child')).toBeDefined();
    expect(screen.getByTestId('event-modal-host')).toBeDefined();
    expect(screen.getByTestId('created-event-share-host')).toBeDefined();
    expect(mocks.storeInit).toHaveBeenCalledWith(user);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('renders children without hydrating the store when the request is anonymous', async () => {
    mocks.authUser.mockResolvedValue(null);

    await renderLayout();

    expect(screen.getByTestId('child')).toBeDefined();
    expect(screen.getByTestId('event-modal-host')).toBeDefined();
    expect(screen.getByTestId('created-event-share-host')).toBeDefined();
    expect(screen.queryByTestId('user-store-initializer')).toBeNull();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('sends a half-onboarded user to onboarding and stops rendering', async () => {
    mocks.authUser.mockResolvedValue(profile({ username: null }));
    setPathname();

    await expect(renderLayout()).rejects.toThrow('NEXT_REDIRECT:/onboard');

    expect(mocks.redirect).toHaveBeenCalledWith('/onboard');
    expect(screen.queryByTestId('child')).toBeNull();
  });

  it('keeps the full requested path, including the query string, as the return target', async () => {
    mocks.authUser.mockResolvedValue(profile({ username: '' }));
    setPathname('/feed?event=12&tab=wishes');

    await expect(renderLayout()).rejects.toThrow('NEXT_REDIRECT');

    expect(mocks.redirect).toHaveBeenCalledWith(
      `/onboard?next=${encodeURIComponent('/feed?event=12&tab=wishes')}`,
    );
  });

  it.each([
    ['an absolute external url', 'https://evil.example/steal'],
    ['the onboarding page itself', '/onboard'],
  ])('drops %s and falls back to plain /onboard', async (_label, pathname) => {
    mocks.authUser.mockResolvedValue(profile({ username: null }));
    setPathname(pathname);

    await expect(renderLayout()).rejects.toThrow('NEXT_REDIRECT:/onboard');

    expect(mocks.redirect).toHaveBeenCalledWith('/onboard');
  });

  it('does not read the pathname header for a fully onboarded user', async () => {
    mocks.authUser.mockResolvedValue(profile());

    await renderLayout();

    expect(mocks.headers).not.toHaveBeenCalled();
  });
});
