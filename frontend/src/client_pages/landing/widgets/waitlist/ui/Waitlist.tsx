'use client';

import clsx from 'clsx';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { type SubmitEvent, useEffect, useRef, useState } from 'react';
import z from 'zod';

import { TextInput } from '@shared/ui/textInput/TextInput';
import { useValidation } from '@/features/useValidation/useValidation';

import { SurveyDropdown } from './SurveyDropdown';
import s from './waitlist.module.scss';

const SURVEY_OPTIONS = [
  'Finding time for everyone',
  'Fear of texting first',
  'Getting "I\'m busy" replies',
  'Deciding where to go',
  'Everything is easy for me',
];

const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(
    /^[a-zA-Z\s'-]+$/,
    'Name can only contain letters, spaces, hyphens and apostrophes',
  );

const emailSchema = z.email('Please enter a valid email address');

const EXIT_DURATION = 760;

export const Waitlist = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [struggle, setStruggle] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const nameValidation = useValidation(nameSchema);
  const emailValidation = useValidation(emailSchema);

  useEffect(() => {
    router.prefetch('/thank-you');

    return () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, [router]);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLeaving) return;

    const isNameValid = nameValidation.check(name);
    const isEmailValid = emailValidation.check(email);

    if (!isNameValid || !isEmailValid) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReducedMotion) {
      router.push('/thank-you');

      return;
    }

    setIsLeaving(true);
    exitTimer.current = setTimeout(
      () => router.push('/thank-you'),
      EXIT_DURATION,
    );
  };

  return (
    <section id="waitlist" className={s.section}>
      <div className={clsx(s.inner, isLeaving && s.innerLeaving)}>
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
                  error={nameValidation.error}
                  isSuccess={nameValidation.isSuccess}
                />
                <TextInput
                  id="waitlist-email"
                  placeholder="Email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  error={emailValidation.error}
                  isSuccess={emailValidation.isSuccess}
                />
              </div>

              <div className={s.survey}>
                <SurveyDropdown
                  label="💬 Want to help us build it? Share your biggest meetup struggle (optional)"
                  placeholder="Select an option..."
                  options={SURVEY_OPTIONS}
                  value={struggle}
                  onChange={setStruggle}
                />
              </div>
            </div>

            <button
              type="submit"
              className={clsx(s.submit, isLeaving && s.submitDone)}
              aria-disabled={isLeaving}
            >
              <span key={String(isLeaving)} className={s.submitLabel}>
                {isLeaving ? "You're in!" : 'Get Early Access'}
              </span>
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

      {isLeaving && <div className={s.veil} aria-hidden />}
    </section>
  );
};
