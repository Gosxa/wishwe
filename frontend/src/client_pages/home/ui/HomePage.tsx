'use client';

import { Header } from '@widgets/header';
import { Sidebar } from '@widgets/sidebar';
import { useUserStore } from '@/shared/store/useUserStore';
import s from './homePage.module.scss';

export default function HomePage() {
  const user = useUserStore(store => store.user);

  return (
    <div className={s.shell}>
      <Header />
      <div className={s.body}>
        <Sidebar activeKey="home" />
        <main className={s.content}>
          <pre>{JSON.stringify(user, null, 2)}</pre>
          {user?.avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt="avatar" width={80} height={80} />
          )}
        </main>
      </div>
    </div>
  );
}
