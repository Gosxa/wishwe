'use client';

import type { MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import s from './thankYou.module.scss';

const ONBOARD_PATH = '/onboard';
const EXIT_DURATION_MS = 320;

export const ThankYou = () => {
  const router = useRouter();
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    router.prefetch(ONBOARD_PATH);

    return () => {
      if (navigationTimer.current) clearTimeout(navigationTimer.current);
    };
  }, [router]);

  const handleInviteClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const isModifiedClick =
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey;

    if (isModifiedClick) return;

    event.preventDefault();

    if (isLeaving) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      router.push(ONBOARD_PATH);

      return;
    }

    setIsLeaving(true);
    navigationTimer.current = setTimeout(
      () => router.push(ONBOARD_PATH),
      EXIT_DURATION_MS,
    );
  };

  return (
    <main className={`${s.page} ${isLeaving ? s.leaving : ''}`}>
      <Image
        className={s.bg}
        src="/landing/thank-you-bg.png"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
      />

      <div className={s.content}>
        <div className={s.text}>
          <h1 className={s.title}>Cool, you&apos;re in!</h1>
          <p className={s.subtitle}>
            What&apos;s a meetup without your crew? Invite 3 friends so you can
            start planning together as soon as we launch.
          </p>
        </div>

        <Link
          href={ONBOARD_PATH}
          className={s.cta}
          onClick={handleInviteClick}
          aria-disabled={isLeaving}
        >
          Invite friends
        </Link>
      </div>
    </main>
  );
};
