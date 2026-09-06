'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Header } from '@widgets/header';
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
    error,
    retry,
    removeFriend,
    acceptRequest,
    declineRequest,
  } = useFriends();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
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
        mobileFeedLayout
        search={{
          value: query,
          onChange: setQuery,
          placeholder: 'Search friends',
        }}
      />
      <div className={s.body}>
        <main className={s.content}>
          <div className={s.tabs} aria-label="Friends views">
            <button
              type="button"
              aria-pressed={activeTab === 'friends'}
              onClick={() => setActiveTab('friends')}
            >
              Your friends
            </button>
            <button
              type="button"
              aria-pressed={activeTab === 'requests'}
              onClick={() => setActiveTab('requests')}
            >
              Requests
            </button>
          </div>
          <div className={s.columns}>
            <div
              className={clsx(
                s.leftCol,
                activeTab !== 'friends' && s.mobileHidden,
                activeTab === 'friends' && s.activePane,
              )}
            >
              <FriendsList
                friends={friends}
                query={query}
                isLoading={isLoading}
                error={error}
                onRetry={retry}
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
            <div
              className={clsx(
                s.rightCol,
                activeTab !== 'requests' && s.mobileHidden,
                activeTab === 'requests' && s.activePane,
              )}
            >
              <div className={s.invite}>
                <FindMoreFriends />
              </div>
              <Requests
                requests={requests.filter(request =>
                  request.username
                    .toLowerCase()
                    .includes(query.trim().toLowerCase()),
                )}
                isLoading={isLoading}
                error={error}
                onRetry={retry}
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
