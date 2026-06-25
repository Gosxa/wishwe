'use client';

import Image from 'next/image';

import { smoothScrollToSelector } from '@/shared/lib/smoothScroll';

import s from './readyToWish.module.scss';

const POLAROIDS = [
  {
    src: '/landing/polaroid-1.png',
    alt: 'Friends posing together on the shore at sunset',
  },
  {
    src: '/landing/polaroid-2.png',
    alt: 'Two friends celebrating on the beach at sunset',
  },
  {
    src: '/landing/polaroid-3.png',
    alt: 'Friends jumping in the air at sunset',
  },
];

export const ReadyToWish = () => {
  return (
    <section className={s.section}>
      <Image
        className={s.bg}
        src="/landing/ready-bg.png"
        alt=""
        aria-hidden
        fill
        sizes="100vw"
      />

      <div className={s.inner}>
        <div className={s.content}>
          <div className={s.text}>
            <h2 className={s.title}>Ready to add your first Wish?</h2>
            <p className={s.subtitle}>
              Join the Waitlist now. Invite friends and get Founding Member
              status on launch day.
            </p>
          </div>

          <a
            className={s.cta}
            href="#waitlist"
            onClick={e => {
              e.preventDefault();
              smoothScrollToSelector('#waitlist');
            }}
          >
            Get Early Access
          </a>
        </div>

        <div className={s.gallery}>
          {POLAROIDS.map(photo => (
            <div key={photo.src} className={s.polaroid}>
              <Image
                src={photo.src}
                alt={photo.alt}
                width={193}
                height={234}
                sizes="(max-width: 900px) 30vw, 193px"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
