'use client';

import { useRouter } from 'next/navigation';
import { ActivityFeed, Header } from '@widgets/header';
import s from './activityPage.module.scss';

export default function ActivityPage() {
  const router = useRouter();

  return (
    <div className={s.shell}>
      <Header
        mobileFeedLayout
        search={{
          onSearch: query =>
            router.push(`/feed?title=${encodeURIComponent(query.trim())}`),
        }}
      />
      <main className={s.content}>
        <ActivityFeed />
      </main>
    </div>
  );
}
