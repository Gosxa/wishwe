import Image from 'next/image';
import Link from 'next/link';

import s from './thankYou.module.scss';

export const ThankYou = () => {
  return (
    <main className={s.page}>
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

        <Link href="/onboard" className={s.cta}>
          Invite friends
        </Link>
      </div>
    </main>
  );
};
