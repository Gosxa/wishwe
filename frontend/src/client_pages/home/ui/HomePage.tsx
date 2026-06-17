'use client';

import { Suspense, useState } from 'react';
import { Header } from '@widgets/header';
import { Sidebar } from '@widgets/sidebar';
import { useFeedSearch } from '@client_pages/home/model/useFeedSearch';
import { Feed } from '../widgets/feed';
import s from './homePage.module.scss';

export default function HomePage() {
  // useFeedSearch and the feed read the URL via useSearchParams, which must sit
  // under a Suspense boundary so any page rendering HomePage can prerender.
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const search = useFeedSearch();
  const [searchDisabled, setSearchDisabled] = useState(false);

  return (
    <div className={s.shell}>
      <Header
        search={{
          ...search,
          disabled: searchDisabled,
          disabledHint:
            'Search is available once there are events in your feed. Add friends or create an event to get started.',
        }}
      />
      <div className={s.body}>
        <Sidebar activeKey="home" />
        <main className={s.content}>
          <Feed onSearchDisabledChange={setSearchDisabled} />
        </main>
      </div>
    </div>
  );
}
