'use client';

import { useCallback, useEffect, useId, useRef } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { useModalAttention } from '@shared/hooks/useModalAttention';
import { useModalTransition } from '@shared/hooks/useModalTransition';
import { useAnchorSettled } from '../model/useAnchorSettled';
import { useScrollLock } from '../model/useScrollLock';
import { useTourKeyboard } from '../model/useTourKeyboard';
import { useTourLayout } from '../model/useTourLayout';
import { isPassthrough } from '../model/types';
import type { AnchorRect, TourEndReason, TourStep } from '../model/types';
import { TourCard } from './TourCard';
import { TourClickShield } from './TourClickShield';
import s from './productTour.module.scss';

type Props = {
  steps: TourStep[];
  index: number;
  onNext: () => void;
  onBack?: () => void;
  onEnd: (reason: TourEndReason) => void;
  onQuickFill?: (step: TourStep) => void;
  nextDisabled?: boolean;
};

const rectStyle = (rect: AnchorRect | null): CSSProperties => ({
  top: rect?.top ?? 0,
  left: rect?.left ?? 0,
  width: rect?.width ?? 0,
  height: rect?.height ?? 0,
  borderRadius: rect?.radius ?? 0,
});

export const ProductTour = ({
  steps,
  index,
  onNext,
  onBack,
  onEnd,
  onQuickFill,
  nextDisabled = false,
}: Props) => {
  const cardRef = useRef<HTMLElement>(null);
  const pulseModal = useModalAttention(cardRef);
  const endedRef = useRef(false);
  const { requestCloseWith, overlayRef, modalTransitionProps } =
    useModalTransition();

  const titleId = useId();
  const bodyId = useId();

  const step = steps[index];
  const isLast = index === steps.length - 1;
  const isAnchored = Boolean(step?.anchor);
  const passthrough = step ? isPassthrough(step) : false;

  const anchoredSteps = steps.filter(item => item.anchor);
  const anchoredNumber = step?.anchor ? anchoredSteps.indexOf(step) + 1 : 0;

  const { rect, position, hasAnchor } = useTourLayout(step, cardRef);
  const isSettled = useAnchorSettled(step, hasAnchor);

  const end = useCallback(
    (reason: TourEndReason) => {
      if (endedRef.current) return;

      endedRef.current = true;
      requestCloseWith(() => onEnd(reason));
    },
    [onEnd, requestCloseWith],
  );

  const goNext = useCallback(() => {
    if (endedRef.current) return;

    if (isLast) end('finished');
    else onNext();
  }, [end, isLast, onNext]);

  useScrollLock(overlayRef);
  useTourKeyboard({
    cardRef,
    goBack: onBack ?? (() => {}),
    goNext,
    enabled: !passthrough,
  });

  useEffect(() => {
    if (passthrough) return;

    cardRef.current?.focus({ preventScroll: true });
  }, [index, passthrough]);

  if (!step) return null;

  return createPortal(
    <div
      {...modalTransitionProps}
      className={clsx(s.overlay, passthrough && s.overlayPassthrough)}
      role="presentation"
      onClick={passthrough ? undefined : pulseModal}
    >
      {passthrough && <TourClickShield rect={rect} onClick={pulseModal} />}

      <div
        className={clsx(s.spotlight, passthrough && s.spotlightSoft)}
        style={rectStyle(rect)}
      />

      <div
        className={clsx(s.halo, (!isAnchored || !isSettled) && s.haloHidden)}
        style={rectStyle(rect)}
      />

      <TourCard
        step={step}
        isLast={isLast}
        position={isSettled ? position : null}
        anchoredSteps={anchoredSteps}
        anchoredNumber={anchoredNumber}
        titleId={titleId}
        bodyId={bodyId}
        cardRef={cardRef}
        nextDisabled={nextDisabled}
        onBack={onBack}
        onNext={goNext}
        onQuickFill={onQuickFill}
        onSkip={() => end('skipped')}
      />
    </div>,
    document.body,
  );
};
