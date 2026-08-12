// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChangeEvent } from 'react';
import type { SearchResult } from '../model/types';

const hookMocks = vi.hoisted(() => ({
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
    selector({ user: { username: 'CurrentUser' } }),
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

vi.mock('@widgets/sidebar', () => ({
  Sidebar: () => null,
}));

vi.mock('./FriendsList', () => ({
  FriendsList: () => null,
}));

vi.mock('./FindMoreFriends', () => ({
  FindMoreFriends: () => null,
}));

vi.mock('./Requests', () => ({
  Requests: () => null,
}));

vi.mock('./MorePeople', () => ({
  MorePeople: ({ results }: { results: SearchResult[] }) => (
    <ul aria-label="Other people">
      {results.map(result => (
        <li key={result.userId}>{result.username || '(blank)'}</li>
      ))}
    </ul>
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
    hookMocks.useFriends.mockReset();
    hookMocks.useUserSearch.mockReset();

    hookMocks.useFriends.mockReturnValue({
      friends: [{ id: 1, username: 'Alice', avatar: null, friendshipId: 11 }],
      requests: [{ id: 2, username: 'Bob', avatar: null }],
      isLoading: false,
      error: null,
      removeFriend: vi.fn(),
      acceptRequest: vi.fn(),
      declineRequest: vi.fn(),
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
    expect(screen.getByRole('list', { name: 'Other people' }).textContent).toBe(
      'Charlie',
    );
    expect(screen.queryByText('alice')).toBeNull();
    expect(screen.queryByText('BOB')).toBeNull();
    expect(screen.queryByText('currentuser')).toBeNull();
    expect(screen.queryByText('(blank)')).toBeNull();
  });
});
