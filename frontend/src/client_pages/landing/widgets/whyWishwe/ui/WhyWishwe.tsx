import Image from 'next/image';

import { ArrowDownShort } from '@shared/ui/icons';

import s from './whyWishwe.module.scss';

type Benefit = {
  n: string;
  title: string;
  body: string;
};

const BENEFITS: Benefit[] = [
  {
    n: '01',
    title: 'No assumptions',
    body: 'Stop deciding for others. Post your plan and let friends surprise you.',
  },
  {
    n: '02',
    title: 'No group chat chaos',
    body: 'All friends in one place. No more running through dozens of messy chats.',
  },
  {
    n: '03',
    title: 'No strings attached',
    body: 'Friends join only when they actually want to.\nNo pressure, no awkward rejections.',
  },
  {
    n: '04',
    title: 'Safe circle',
    body: 'Plans grow organically. Expand your crew safely through mutual friends.',
  },
];

export const WhyWishwe = () => {
  return (
    <section className={s.section}>
      <div className={s.inner}>
        <div className={s.columns}>
          <div className={s.column}>
            <div className={`${s.card} ${s.problemCard}`}>
              <h2 className={s.problemTitle}>
                How many plans never happened because you didn&apos;t even ask?
              </h2>
            </div>

            <div className={`${s.card} ${s.proseCard} ${s.orangeCard}`}>
              <p className={s.prose}>
                <strong>We&apos;ve all been there:</strong> you feel like going
                to the theater or playing padel, but then you{' '}
                <strong>assume</strong> Anna hates sports and Tim is busy, so
                you <strong>invite no one</strong>.<br />
                <strong>The plan is canceled.</strong>
              </p>
            </div>

            <div className={`${s.card} ${s.proseCard} ${s.solutionCard}`}>
              <p className={s.prose}>
                <strong>With WishWe</strong>, you just drop an idea. Turns out
                Anna wants to try padel and Tim is free. They hit{' '}
                <strong>&quot;join&quot;</strong> and the crew gathers.{' '}
                <strong>Zero chat spam.</strong>
              </p>
            </div>

            <div className={s.photo}>
              <Image
                src="/landing/friends-together.webp"
                alt=""
                aria-hidden
                fill
                priority
                sizes="(max-width: 900px) 100vw, 50vw"
              />
            </div>
          </div>

          <div className={s.column}>
            <div className={s.birds}>
              <Image
                src="/landing/sky-plane.webp"
                alt=""
                aria-hidden
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
              />
            </div>

            <div className={`${s.card} ${s.benefitsHeader}`}>
              <h2 className={s.benefitsHeaderTitle}>
                Why you&apos;ll love WishWe:
              </h2>
              <span className={s.benefitsArrow} aria-hidden>
                <ArrowDownShort />
              </span>
            </div>

            <ul className={s.benefitList}>
              {BENEFITS.map((benefit, i) => (
                <li
                  key={benefit.n}
                  className={`${s.card} ${s.benefit} ${
                    i % 2 === 0 ? s.benefitFilled : s.benefitOutlined
                  }`}
                >
                  <span className={s.benefitNum}>{benefit.n}</span>
                  <h3 className={s.benefitTitle}>{benefit.title}</h3>
                  <p className={s.benefitBody}>{benefit.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
