'use client';

import clsx from 'clsx';
import type { BackendEventType } from '@/shared/client_api/event';
import { Check, Sparkles } from '@shared/ui/icons';
import s from './wishLaunchTransition.module.scss';

export type WishLaunchState = 'idle' | 'publishing' | 'success';

type Props = {
  state: WishLaunchState;
  eventType: BackendEventType;
  title: string;
  isModerationPending?: boolean;
};

const COPY = {
  plan: {
    publishingTitle: 'Putting your plan in motion…',
    publishingBody:
      'Creating its share card and finding it a place in the feed.',
    successTitle: 'Your plan is live!',
  },
  wish: {
    publishingTitle: 'Setting your wish free…',
    publishingBody:
      'Creating its share card and finding it a place in the feed.',
    successTitle: 'Your wish is live!',
  },
} as const;

export const WishLaunchTransition = ({
  state,
  eventType,
  title,
  isModerationPending = false,
}: Props) => {
  if (state === 'idle') return null;

  const copy = COPY[eventType];
  const isSuccess = state === 'success';

  return (
    <div className={clsx(s.overlay, isSuccess && s.success)} data-state={state}>
      <div className={s.ambient} aria-hidden="true" />

      <div className={s.scene} aria-hidden="true">
        <span className={clsx(s.orbit, s.orbitOuter)}>
          <span className={s.orbitDot} />
        </span>
        <span className={clsx(s.orbit, s.orbitInner)}>
          <span className={s.orbitDot} />
        </span>

        <div className={s.card}>
          <div className={s.cardTopline}>
            <span className={s.typePill}>{eventType}</span>
            <span className={s.brand}>WishWe</span>
          </div>
          <strong className={s.cardTitle}>{title}</strong>
          <span className={s.cardLine} />
          <span className={s.cardLineShort} />
          <span className={s.shimmer} />

          <span className={s.successStamp}>
            <Check />
          </span>
        </div>

        <div className={s.sparkleBadge}>
          <Sparkles />
        </div>

        <div className={s.burst}>
          {Array.from({ length: 8 }, (_, index) => (
            <span key={index} className={s.burstParticle} />
          ))}
        </div>
      </div>

      <div
        key={state}
        className={s.copy}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-state={state}
      >
        <p className={s.heading}>
          {isSuccess && isModerationPending
            ? 'Your event is under review'
            : isSuccess
              ? copy.successTitle
              : copy.publishingTitle}
        </p>
        <p className={s.body}>
          {isSuccess && isModerationPending
            ? 'Only you can see it while the image is checked. If all checks pass, it will appear in the feed automatically.'
            : isSuccess
              ? 'One more beat—getting it ready to share.'
              : copy.publishingBody}
        </p>
        <span className={s.progress} aria-hidden="true">
          <span />
        </span>
      </div>
    </div>
  );
};
