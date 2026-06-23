import Image from 'next/image';

import s from './howItWorks.module.scss';

type Step = {
  image: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    image: '/landing/create-a-wish.png',
    title: 'Create a wish',
    body: 'Coffee on Wednesday? Padel on Saturday? Bar on Friday? Just drop your idea and let it fly.',
  },
  {
    image: '/landing/friends-in.png',
    title: 'See which friends are in',
    body: 'Without hundreds of unread messages, awkward chats, or “great idea, but maybe next week?”',
  },
  {
    image: '/landing/meet-up.png',
    title: 'Meet up',
    body: 'Gather your perfect crew automatically. Make it happen in real life without any extra pressure.',
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className={s.section}>
      <div className={s.inner}>
        <header className={s.header}>
          <h2 className={s.title}>Organizing meetups made simple</h2>
          <p className={s.subtitle}>
            We took the stress out of planning. Just share your idea, and let
            your friends decide if they&apos;re down to join, no pressure.
          </p>
        </header>

        <ul className={s.cards}>
          {STEPS.map(step => (
            <li key={step.title} className={s.card}>
              <div className={s.cardImage}>
                <Image
                  src={step.image}
                  alt=""
                  aria-hidden
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className={s.cardText}>
                <h3 className={s.cardTitle}>{step.title}</h3>
                <p className={s.cardBody}>{step.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
