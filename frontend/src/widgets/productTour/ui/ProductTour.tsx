'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from '@shared/ui/icons';
import {
  centerRect,
  findAnchors,
  measureAnchors,
  placeCard,
} from '../model/geometry';
import type {
  AnchorRect,
  CardPosition,
  TourEndReason,
  TourStep,
} from '../model/types';
import s from './productTour.module.scss';

const EXIT_MS = 260;

const CARD_KEYS = new Set([
  'ArrowRight',
  'ArrowLeft',
  'ArrowDown',
  'ArrowUp',
  'PageDown',
  'PageUp',
  'Home',
  'End',
  ' ',
]);

const FOCUSABLE =
  'button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])';

const PLACEMENT_CLASS = {
  top: s.placeTop,
  bottom: s.placeBottom,
  left: s.placeLeft,
  right: s.placeRight,
} as const;

type Props = {
  steps: TourStep[];
  onEnd: (reason: TourEndReason) => void;
};

export const ProductTour = ({ steps: tourSteps, onEnd }: Props) => {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<AnchorRect | null>(null);
  const [position, setPosition] = useState<CardPosition | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const endedRef = useRef(false);

  const titleId = useId();
  const bodyId = useId();

  const step = tourSteps[index];
  const isAnchored = Boolean(step?.anchor);
  const isLast = index === tourSteps.length - 1;

  const anchoredSteps = tourSteps.filter(item => item.anchor);
  const anchoredTotal = anchoredSteps.length;
  const anchoredNumber = step?.anchor ? anchoredSteps.indexOf(step) + 1 : 0;

  const end = useCallback(
    (reason: TourEndReason) => {
      if (endedRef.current) return;

      endedRef.current = true;
      setIsExiting(true);
      window.setTimeout(() => onEnd(reason), EXIT_MS);
    },
    [onEnd],
  );

  const goNext = useCallback(() => {
    if (endedRef.current) return;

    if (isLast) {
      end('finished');
    } else {
      setIndex(current => current + 1);
    }
  }, [end, isLast]);

  const goBack = useCallback(() => {
    setIndex(current => Math.max(0, current - 1));
  }, []);

  const sync = useCallback(() => {
    if (!step) return;

    const elements = findAnchors(step.anchor);
    const nextRect = elements.length
      ? measureAnchors(elements, step)
      : centerRect();

    setRect(nextRect);

    const card = cardRef.current;

    if (!card) return;

    const { width, height } = card.getBoundingClientRect();
    const viewport = { width: window.innerWidth, height: window.innerHeight };

    setPosition(
      step.anchor
        ? placeCard(
            nextRect,
            { width, height },
            step.placement ?? 'bottom',
            viewport,
          )
        : {
            top: (viewport.height - height) / 2,
            left: (viewport.width - width) / 2,
            placement: 'bottom',
            arrow: -1,
          },
    );
  }, [step]);

  useEffect(() => {
    let frame = 0;

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    };

    schedule();

    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);

    const observer = new ResizeObserver(schedule);

    observer.observe(document.body);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      observer.disconnect();
    };
  }, [sync]);

  useEffect(() => {
    const node = overlayRef.current;

    if (!node) return;

    const block = (event: Event) => event.preventDefault();

    node.addEventListener('wheel', block, { passive: false });
    node.addEventListener('touchmove', block, { passive: false });

    return () => {
      node.removeEventListener('wheel', block);
      node.removeEventListener('touchmove', block);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        end('skipped');

        return;
      }

      if (event.key === 'Tab') {
        const focusable =
          cardRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);

        if (!focusable?.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        const isInside = cardRef.current?.contains(active) ?? false;

        if (!isInside) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        } else if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }

        return;
      }

      if (!CARD_KEYS.has(event.key)) return;

      if (
        event.key === ' ' &&
        event.target instanceof HTMLElement &&
        event.target.closest(FOCUSABLE)
      ) {
        return;
      }

      event.preventDefault();

      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        goBack();
      } else if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        goNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [end, goBack, goNext]);

  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true });
  }, [index]);

  if (!step) return null;

  const primaryLabel = step.primaryLabel ?? (isLast ? 'Got it' : 'Next');

  return createPortal(
    <div
      ref={overlayRef}
      className={clsx(s.overlay, isExiting && s.overlayExiting)}
      role="presentation"
    >
      <div
        className={s.spotlight}
        style={{
          top: rect?.top ?? 0,
          left: rect?.left ?? 0,
          width: rect?.width ?? 0,
          height: rect?.height ?? 0,
          borderRadius: rect?.radius ?? 0,
        }}
      />

      <div
        className={clsx(s.halo, !isAnchored && s.haloHidden)}
        style={{
          top: rect?.top ?? 0,
          left: rect?.left ?? 0,
          width: rect?.width ?? 0,
          height: rect?.height ?? 0,
          borderRadius: rect?.radius ?? 0,
        }}
      />

      <section
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className={clsx(
          s.card,
          !isAnchored && s.cardCenter,
          position && PLACEMENT_CLASS[position.placement],
          !position && s.cardMeasuring,
        )}
        style={
          position ? { top: position.top, left: position.left } : undefined
        }
      >
        {isAnchored && position && (
          <span
            aria-hidden
            className={s.arrow}
            style={
              position.placement === 'top' || position.placement === 'bottom'
                ? { left: position.arrow }
                : { top: position.arrow }
            }
          />
        )}

        <div key={step.id} className={s.content}>
          {isAnchored ? (
            <div className={s.head}>
              <span className={s.counter}>
                {anchoredNumber} of {anchoredTotal}
              </span>
              <button
                type="button"
                className={s.close}
                aria-label="Close the tour"
                onClick={() => end('skipped')}
              >
                <X />
              </button>
            </div>
          ) : (
            <span className={s.sparkle} aria-hidden>
              {isLast ? <Check /> : <Sparkles />}
            </span>
          )}

          <h2 id={titleId} className={s.title}>
            {step.title}
          </h2>
          <p id={bodyId} className={s.body}>
            {step.body}
          </p>

          <div className={s.footer}>
            {isAnchored ? (
              <div className={s.dots} aria-hidden>
                {anchoredSteps.map((item, dotIndex) => (
                  <span
                    key={item.id}
                    className={clsx(
                      s.dot,
                      dotIndex === anchoredNumber - 1 && s.dotActive,
                    )}
                  />
                ))}
              </div>
            ) : (
              <span />
            )}

            <div className={s.actions}>
              {index > 0 && (
                <button type="button" className={s.back} onClick={goBack}>
                  <ChevronLeft />
                  <span>{step.secondaryLabel ?? 'Back'}</span>
                </button>
              )}
              {index === 0 && (
                <button
                  type="button"
                  className={s.skip}
                  onClick={() => end('skipped')}
                >
                  <span>{step.secondaryLabel ?? 'Skip for now'}</span>
                </button>
              )}
              <button type="button" className={s.next} onClick={goNext}>
                <span>{primaryLabel}</span>
                {!isLast && <ChevronRight />}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
};
