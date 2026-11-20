'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

import { Header } from '@widgets/header';
import {
  submitSupportRequest,
  SupportRequestError,
} from '@/shared/client_api/support';
import type {
  SupportCategory,
  SupportRequestPayload,
  SupportRequestResult,
} from '@/shared/client_api/support';
import s from './supportPage.module.scss';

const categories: { value: SupportCategory; label: string }[] = [
  { value: 'technical_issue', label: 'Technical issue' },
  { value: 'account_access', label: 'Account and sign-in' },
  { value: 'feature_idea', label: 'Feature idea' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'privacy_data', label: 'Privacy or data request' },
  { value: 'safety_report', label: 'Safety or abuse report' },
  { value: 'other', label: 'Other' },
];

const failedDeliveryCopy =
  'Your request is saved, but we could not notify the support inbox. ' +
  'Please contact us using the link below.';
const failedDeliveryWithoutAddressCopy =
  'Your request is saved, but we could not notify the support inbox.';
const receivedCopy =
  'We’ve received your message and will reply to your email.';

type Props = {
  initialEmail: string;
  initialDisplayName: string;
};

export const SupportPage = ({ initialEmail, initialDisplayName }: Props) => {
  const [form, setForm] = useState<SupportRequestPayload>({
    email: initialEmail,
    display_name: initialDisplayName,
    category: 'technical_issue',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SupportRequestResult | null>(null);

  const updateField = <K extends keyof SupportRequestPayload>(
    key: K,
    value: SupportRequestPayload[K],
  ) => setForm(current => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await submitSupportRequest({
        ...form,
        email: form.email.trim(),
        display_name: form.display_name.trim(),
        message: form.message.trim(),
      });
      setResult(response);
    } catch (submissionError) {
      setError(
        submissionError instanceof SupportRequestError
          ? submissionError.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const emailFailed = result?.delivery_status === 'failed';

  return (
    <div className={s.shell}>
      <Header mobileFeedLayout />
      <div className={s.body}>
        <main className={s.content}>
          <div className={s.intro}>
            <p className={s.eyebrow}>WISHWE SUPPORT</p>
            <h1>We’re here to help.</h1>
            <p className={s.description}>
              Something not working? Have an idea to make WishWe better? Send us
              a note and we’ll get back to you by email.
            </p>

            <div className={s.illustration} aria-hidden="true">
              <span className={s.sparkle}>✦</span>
              <span className={s.smallSparkle}>✳</span>
              <div className={s.bubble}>
                <span />
                <span />
                <span />
              </div>
              <div className={s.note}>
                <span className={s.heart}>♥</span>
                <span>Good things start with a conversation</span>
              </div>
            </div>

            <div className={s.promise}>
              <span className={s.promiseIcon} aria-hidden="true">
                ↗
              </span>
              <p>
                Your message goes straight to the WishWe team. We’ll reply to
                the email you provide.
              </p>
            </div>
          </div>

          <section className={s.formCard} aria-labelledby="support-form-title">
            {result ? (
              <div className={s.success} role="status">
                <div className={emailFailed ? s.warningIcon : s.successIcon}>
                  {emailFailed ? '!' : '✓'}
                </div>
                <p className={s.eyebrow}>
                  {emailFailed ? 'SAVED FOR THE TEAM' : 'MESSAGE SENT'}
                </p>
                <h2>
                  {emailFailed
                    ? 'Your note is saved.'
                    : 'Thanks for reaching out!'}
                </h2>
                <p className={s.successCopy}>
                  {emailFailed
                    ? result.support_email
                      ? failedDeliveryCopy
                      : failedDeliveryWithoutAddressCopy
                    : receivedCopy}
                </p>
                {emailFailed && result.support_email && (
                  <a
                    className={s.emailFallback}
                    href={`mailto:${result.support_email}`}
                  >
                    Email us directly
                  </a>
                )}
                <button
                  className={s.resetButton}
                  onClick={() => setResult(null)}
                  type="button"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <div className={s.formHeading}>
                  <div>
                    <p className={s.eyebrow}>LET’S TALK</p>
                    <h2 id="support-form-title">Write to us</h2>
                  </div>
                  <span className={s.formMark} aria-hidden="true">
                    ✳
                  </span>
                </div>

                <form className={s.form} onSubmit={submit}>
                  <label className={s.field}>
                    <span>Email</span>
                    <input
                      autoComplete="email"
                      name="email"
                      onChange={event =>
                        updateField('email', event.target.value)
                      }
                      placeholder="you@example.com"
                      required
                      type="email"
                      value={form.email}
                    />
                  </label>

                  <label className={s.field}>
                    <span>
                      Name or nickname <small>Optional</small>
                    </span>
                    <input
                      autoComplete="name"
                      maxLength={100}
                      name="display_name"
                      onChange={event =>
                        updateField('display_name', event.target.value)
                      }
                      placeholder="How should we address you?"
                      value={form.display_name}
                    />
                  </label>

                  <label className={s.field}>
                    <span>What’s this about?</span>
                    <select
                      name="category"
                      onChange={event =>
                        updateField(
                          'category',
                          event.target.value as SupportCategory,
                        )
                      }
                      value={form.category}
                    >
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={s.field}>
                    <span id="support-message-label">Your message</span>
                    <textarea
                      aria-describedby="support-message-counter"
                      aria-labelledby="support-message-label"
                      maxLength={5000}
                      name="message"
                      onChange={event =>
                        updateField('message', event.target.value)
                      }
                      placeholder="Tell us a little more…"
                      required
                      rows={5}
                      value={form.message}
                    />
                    <small
                      aria-live="polite"
                      className={s.counter}
                      id="support-message-counter"
                    >
                      {form.message.length}/5000
                    </small>
                  </label>

                  {error && (
                    <p className={s.error} role="alert">
                      {error}
                    </p>
                  )}

                  <button
                    className={s.submit}
                    disabled={isSubmitting}
                    type="submit"
                  >
                    <span>{isSubmitting ? 'Sending…' : 'Send message'}</span>
                    <span aria-hidden="true">→</span>
                  </button>
                  <p className={s.privacyNote}>
                    We’ll only use your details to respond to this message.
                  </p>
                </form>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};
