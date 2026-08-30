'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Logo } from '@shared/ui/icons';
import s from './notFound.module.scss';

const HOME_PATH = '/feed';

export const NotFound = () => {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();

      return;
    }

    router.push(HOME_PATH);
  };

  return (
    <main className={s.page}>
      <div className={s.glowPurple} aria-hidden />
      <div className={s.glowYellow} aria-hidden />

      <div className={s.content}>
        <Link href={HOME_PATH} className={s.logo} aria-label="WishWe home">
          <Logo height={40} />
        </Link>

        <p className={s.code}>
          <span aria-hidden>404</span>
          <span className={s.srOnly}>Error 404 — page not found</span>
        </p>

        <div className={s.text}>
          <h1 className={s.title}>This plan fell through</h1>
          <p className={s.subtitle}>
            We couldn&apos;t find that page. The link may be broken, or whatever
            lived here has already moved on.
          </p>
        </div>

        <div className={s.actions}>
          <Link href={HOME_PATH} className={s.primary}>
            <span>Take me home</span>
          </Link>
          <button type="button" className={s.tertiary} onClick={handleBack}>
            <span>Go back</span>
          </button>
        </div>
      </div>
    </main>
  );
};
