'use client';

import { useEffect, useId, useRef } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { useScrollLock } from '../model/useScrollLock';
import { useTourKeyboard } from '../model/useTourKeyboard';
import { useTourLayout } from '../model/useTourLayout';
import { useTourNavigation } from '../model/useTourNavigation';
import type { AnchorRect, TourEndReason, TourStep } from '../model/types';
import { TourCard } from './TourCard';
import s from './productTour.module.scss';

type Props = {
  steps: TourStep[];
  onEnd: (reason: TourEndReason) => void;
};

const rectStyle = (rect: AnchorRect | null): CSSProperties => ({
  top: rect?.top ?? 0,
  left: rect?.left ?? 0,
  width: rect?.width ?? 0,
  height: rect?.height ?? 0,
  borderRadius: rect?.radius ?? 0,
});

export const ProductTour = ({ steps: tourSteps, onEnd }: Props) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);

  const titleId = useId();
  const bodyId = useId();

  const { index, isLast, isExiting, end, goBack, goNext } = useTourNavigation(
    tourSteps.length,
    onEnd,
  );

  const step = tourSteps[index];
  const isAnchored = Boolean(step?.anchor);

  const anchoredSteps = tourSteps.filter(item => item.anchor);
  const anchoredNumber = step?.anchor ? anchoredSteps.indexOf(step) + 1 : 0;

  const { rect, position } = useTourLayout(step, cardRef);

  useScrollLock(overlayRef);
  useTourKeyboard({ cardRef, end, goBack, goNext });

  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true });
  }, [index]);

  if (!step) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className={clsx(s.overlay, isExiting && s.overlayExiting)}
      role="presentation"
    >
      <div className={s.spotlight} style={rectStyle(rect)} />

      <div
        className={clsx(s.halo, !isAnchored && s.haloHidden)}
        style={rectStyle(rect)}
      />

      <TourCard
        step={step}
        index={index}
        isLast={isLast}
        position={position}
        anchoredSteps={anchoredSteps}
        anchoredNumber={anchoredNumber}
        titleId={titleId}
        bodyId={bodyId}
        cardRef={cardRef}
        onBack={goBack}
        onNext={goNext}
        onSkip={() => end('skipped')}
      />
    </div>,
    document.body,
  );
};
