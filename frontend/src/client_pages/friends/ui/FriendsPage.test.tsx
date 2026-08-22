// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChangeEvent } from 'react';
import type { SearchResult } from '../model/types';

const hookMocks = vi.hoisted(() => ({
  acceptRequest: vi.fn(),
  copyInvite: vi.fn(),
  declineRequest: vi.fn(),
  removeFriend: vi.fn(),
  useFriends: vi.fn(),
  useUserSearch: vi.fn(),
}));

vi.mock('../model/useFriends', () => ({
  useFriends: hookMocks.useFriends,
}));

vi.mock('../model/useUserSearch', () => ({
  useUserSearch: hookMocks.useUserSearch,
}));

vi.mock('@/shared/store/useUserStore', () => ({
  useUserStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { username: 'CurrentUser', avatar: null } }),
}));

vi.mock('@shared/hooks/useInviteLink', () => ({
  useInviteLink: () => ({ copy: hookMocks.copyInvite, status: 'idle' }),
}));

vi.mock('@/features', () => ({
  useBodyScrollLock: vi.fn(),
}));

vi.mock('@shared/hooks/useModalAttention', () => ({
  useModalAttention: () => vi.fn(),
}));

vi.mock('@shared/hooks/useModalTransition', () => ({
  useModalTransition: (onClose: () => void) => ({
    modalTransitionProps: {},
    requestClose: onClose,
  }),
}));

vi.mock('@widgets/header', () => ({
  Header: ({
    search,
  }: {
    search: {
      value: string;
      onChange: (value: string) => void;
    };
  }) => (
    <input
      aria-label="Search people"
      value={search.value}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        search.onChange(event.target.value)
      }
    />
  ),
}));

import FriendsPage from './FriendsPage';

const searchResult = (userId: number, username: string): SearchResult => ({
  userId,
  username,
  name: username,
  avatar: null,
});

describe('FriendsPage search results', () => {
  beforeEach(() => {
    hookMocks.acceptRequest.mockReset();
    hookMocks.copyInvite.mockReset();
    hookMocks.declineRequest.mockReset();
    hookMocks.removeFriend.mockReset();
    hookMocks.useFriends.mockReset();
    hookMocks.useUserSearch.mockReset();

    hookMocks.useFriends.mockReturnValue({
      friends: [{ id: 1, username: 'Alice', avatar: null, friendshipId: 11 }],
      requests: [{ id: 2, username: 'Bob', avatar: null }],
      isLoading: false,
      error: null,
      removeFriend: hookMocks.removeFriend,
      acceptRequest: hookMocks.acceptRequest,
      declineRequest: hookMocks.declineRequest,
    });
    hookMocks.useUserSearch.mockReturnValue({
      results: [
        searchResult(1, 'alice'),
        searchResult(2, 'BOB'),
        searchResult(3, 'currentuser'),
        searchResult(4, ''),
        searchResult(5, 'Charlie'),
      ],
      hasMore: false,
      isSearching: false,
      error: null,
    });
  });

  afterEach(cleanup);

  it('shows only users who are not self, friends, or incoming requests', () => {
    render(<FriendsPage />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Search people' }), {
      target: { value: 'people' },
    });

    expect(hookMocks.useUserSearch).toHaveBeenLastCalledWith('people');
    expect(screen.getByRole('link', { name: '@Charlie' })).toBeTruthy();
    expect(screen.queryByText('alice')).toBeNull();
    expect(screen.queryByText('BOB')).toBeNull();
    expect(screen.queryByText('currentuser')).toBeNull();
  });

  it('wires friend, request, invite, and removal actions to their models', async () => {
    render(<FriendsPage />);

    expect(screen.getByRole('link', { name: '@Alice' })).toBeTruthy();
    expect(screen.getByRole('link', { name: '@Bob' })).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'Friends' })
        .getAttribute('aria-current'),
    ).toBe('page');

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    fireEvent.click(screen.getByRole('button', { name: 'Decline' }));
    fireEvent.click(screen.getByRole('button', { name: 'Copy link!' }));

    expect(hookMocks.acceptRequest).toHaveBeenCalledWith(2);
    expect(hookMocks.declineRequest).toHaveBeenCalledWith(2);
    expect(hookMocks.copyInvite).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Remove @Alice' }));
    expect(
      screen.getByRole('dialog', { name: 'Unfriend @Alice?' }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Unfriend' }));

    await waitFor(() => {
      expect(hookMocks.removeFriend).toHaveBeenCalledWith(11);
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
