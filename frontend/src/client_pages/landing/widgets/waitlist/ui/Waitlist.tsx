'use client';

import Image from 'next/image';
import { type SubmitEvent, useState } from 'react';

import { TextInput } from '@shared/ui/textInput/TextInput';

import { SurveyDropdown } from './SurveyDropdown';
import s from './waitlist.module.scss';

const SURVEY_OPTIONS = [
  'Finding time for everyone',
  'Fear of texting first',
  'Getting "I\'m busy" replies',
  'Deciding where to go',
  'Everything is easy for me',
];

export const Waitlist = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [struggle, setStruggle] = useState<string | null>(null);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: wire up to the waitlist endpoint
  };

  return (
    <section id="waitlist" className={s.section}>
      <div className={s.inner}>
        <form className={s.form} onSubmit={handleSubmit}>
          <div className={s.intro}>
            <h2 className={s.title}>Be the first to know when we launch 🚀</h2>
            <p className={s.subtitle}>
              We&apos;re launching soon in beta. Secure your spot today.
            </p>
          </div>

          <div className={s.fields}>
            <div className={s.inputs}>
              <div className={s.pair}>
                <TextInput
                  id="waitlist-name"
                  placeholder="Name"
                  value={name}
                  onChange={event => setName(event.target.value)}
                />
                <TextInput
                  id="waitlist-email"
                  placeholder="Email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                />
              </div>

              <SurveyDropdown
                label="💬 Want to help us build it? Share your biggest meetup struggle (optional)"
                placeholder="Select an option..."
                options={SURVEY_OPTIONS}
                value={struggle}
                onChange={setStruggle}
              />
            </div>

            <button type="submit" className={s.submit}>
              Get Early Access
            </button>
          </div>
        </form>

        <div className={s.visual}>
          <Image
            src="/landing/launch-macbook.png"
            alt="The WishWe app shown on a MacBook"
            fill
            sizes="(max-width: 900px) 100vw, 628px"
          />
        </div>
      </div>
    </section>
  );
};
