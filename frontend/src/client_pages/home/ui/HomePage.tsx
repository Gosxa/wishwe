'use client';

import { Spinner } from '@/shared';
import { Header } from '@widgets/header';
import { Sidebar } from '@widgets/sidebar';
import { useFeedEvents } from '../model/useFeedEvents';
import { Feed } from '../widgets/feed';
import s from './homePage.module.scss';

export default function HomePage() {
  const { events, isLoading } = useFeedEvents();

  return (
    <div className={s.shell}>
      <Header />
      <div className={s.body}>
        <Sidebar activeKey="home" />
        <main className={s.content}>
          {isLoading ? <Spinner /> : <Feed events={events} />}
        </main>
      </div>
    </div>
  );
}
