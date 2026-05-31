'use client';

import { Header } from '@widgets/header';
import { Sidebar } from '@widgets/sidebar';
import s from './homePage.module.scss';

export default function HomePage() {
  return (
    <div className={s.shell}>
      <Header />
      <div className={s.body}>
        <Sidebar activeKey="home" />
        <main className={s.content} />
      </div>
    </div>
  );
}
