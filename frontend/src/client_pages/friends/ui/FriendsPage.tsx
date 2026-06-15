'use client';

import { useState } from 'react';
import { Header } from '@widgets/header';
import { Sidebar } from '@widgets/sidebar';
import { useFriends } from '../model/useFriends';
import { FriendsList } from './FriendsList';
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

  return (
    <div className={s.shell}>
      <Header
        search={{
          value: query,
          onChange: setQuery,
          placeholder: 'Search friends',
          disabled: !isLoading && friends.length === 0,
        }}
      />
      <div className={s.body}>
        <Sidebar activeKey="friends" />
        <main className={s.content}>
          <div className={s.columns}>
            <FriendsList
              friends={friends}
              query={query}
              isLoading={isLoading}
              onRemove={removeFriend}
            />
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
