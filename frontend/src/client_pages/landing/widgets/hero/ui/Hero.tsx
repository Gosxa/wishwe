'use client';

import Image from 'next/image';

import { ArrowDown } from '@shared/ui/icons';

import s from './hero.module.scss';

export const Hero = () => {
  return (
    <section className={s.hero}>
      <Image
        className={s.bg}
        src="/people_hero.webp"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
      />
      <div className={s.overlay} />

      <div className={s.inner}>
        <div className={s.content}>
          <div className={s.text}>
            <h1 className={s.title}>See faces, not screens</h1>
            <p className={s.subtitle}>
              Share your ideas, see who&apos;s down to join, and meet up,
              without awkward chats or any pressure.
            </p>
          </div>

          <div className={s.actions}>
            <a className={s.primaryBtn} href="#waitlist">
              Get Early Access
            </a>
            <a className={s.secondaryBtn} href="#how-it-works">
              How it works?
            </a>
          </div>
        </div>

        <button
          type="button"
          className={s.scrollDown}
          aria-label="Scroll down"
          onClick={() =>
            window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })
          }
        >
          <ArrowDown />
        </button>
      </div>
    </section>
  );
};
