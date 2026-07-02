'use client';

import { useMemo, useState } from 'react';
import { Header } from '@widgets/header';
import { Sidebar } from '@widgets/sidebar';
import { useUserStore } from '@/shared/store/useUserStore';
import { useFriends } from '../model/useFriends';
import { useUserSearch } from '../model/useUserSearch';
import { FriendsList } from './FriendsList';
import { MorePeople } from './MorePeople';
import { FindMoreFriends } from './FindMoreFriends';
import { Requests } from './Requests';
import s from './friendsPage.module.scss';

export default function FriendsPage() {
  const {
    friends,
    requests,
    isLoading,
    removeFriend,
    acceptRequest,
    declineRequest,
  } = useFriends();
  const [query, setQuery] = useState('');
  const currentUsername = useUserStore(state => state.user?.username);
  const search = useUserSearch(query);

  const knownUsernames = useMemo(() => {
    const known = new Set(
      [...friends, ...requests].map(person => person.username.toLowerCase()),
    );

    if (currentUsername) known.add(currentUsername.toLowerCase());

    return known;
  }, [friends, requests, currentUsername]);

  const searchResults = useMemo(
    () =>
      search.results.filter(
        person =>
          person.username && !knownUsernames.has(person.username.toLowerCase()),
      ),
    [search.results, knownUsernames],
  );

  const isSearchActive = query.trim().length > 0;

  return (
    <div className={s.shell}>
      <Header
        search={{
          value: query,
          onChange: setQuery,
          placeholder: 'Search people',
        }}
      />
      <div className={s.body}>
        <Sidebar activeKey="friends" />
        <main className={s.content}>
          <div className={s.columns}>
            <div className={s.leftCol}>
              <FriendsList
                friends={friends}
                query={query}
                isLoading={isLoading}
                onRemove={removeFriend}
              />
              {isSearchActive && (
                <MorePeople
                  results={searchResults}
                  hasMore={search.hasMore}
                  isSearching={search.isSearching}
                  error={search.error}
                />
              )}
            </div>
            <div className={s.rightCol}>
              <FindMoreFriends />
              <Requests
                requests={requests}
                isLoading={isLoading}
                onAccept={acceptRequest}
                onDecline={declineRequest}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
