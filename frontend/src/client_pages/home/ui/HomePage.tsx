'use client';

import { Suspense, useState } from 'react';
import { Header } from '@widgets/header';
import { Sidebar } from '@widgets/sidebar';
import { FeedTour } from '@widgets/productTour';
import { useFeedSearch } from '@client_pages/home/model/useFeedSearch';
import { Feed } from '../widgets/feed';
import s from './homePage.module.scss';

type Props = {
  showTour?: boolean;
};

export default function HomePage({ showTour = true }: Props) {
  return (
    <Suspense fallback={null}>
      <HomePageContent showTour={showTour} />
    </Suspense>
  );
}

function HomePageContent({ showTour }: Required<Props>) {
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
      {showTour && <FeedTour />}
    </div>
  );
}
