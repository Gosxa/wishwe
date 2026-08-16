import type { RefObject } from 'react';
import clsx from 'clsx';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from '@shared/ui/icons';
import type { CardPosition, TourStep } from '../model/types';
import s from './productTour.module.scss';

const PLACEMENT_CLASS = {
  top: s.placeTop,
  bottom: s.placeBottom,
  left: s.placeLeft,
  right: s.placeRight,
} as const;

type TourCardProps = {
  step: TourStep;
  index: number;
  isLast: boolean;
  position: CardPosition | null;
  anchoredSteps: TourStep[];
  anchoredNumber: number;
  titleId: string;
  bodyId: string;
  cardRef: RefObject<HTMLElement | null>;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
};

export const TourCard = ({
  step,
  index,
  isLast,
  position,
  anchoredSteps,
  anchoredNumber,
  titleId,
  bodyId,
  cardRef,
  onBack,
  onNext,
  onSkip,
}: TourCardProps) => {
  const isAnchored = Boolean(step.anchor);

  return (
    <section
      data-modal-content
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
      style={position ? { top: position.top, left: position.left } : undefined}
    >
      {isAnchored && position && <CardArrow position={position} />}

      <div key={step.id} className={s.content}>
        <CardHead
          isAnchored={isAnchored}
          isLast={isLast}
          number={anchoredNumber}
          total={anchoredSteps.length}
          onSkip={onSkip}
        />

        <h2 id={titleId} className={s.title}>
          {step.title}
        </h2>
        <p id={bodyId} className={s.body}>
          {step.body}
        </p>

        <div className={s.footer}>
          {isAnchored ? (
            <ProgressDots
              steps={anchoredSteps}
              activeIndex={anchoredNumber - 1}
            />
          ) : (
            <span />
          )}

          <CardActions
            step={step}
            index={index}
            isLast={isLast}
            onBack={onBack}
            onNext={onNext}
            onSkip={onSkip}
          />
        </div>
      </div>
    </section>
  );
};

const CardArrow = ({ position }: { position: CardPosition }) => (
  <span
    aria-hidden
    className={s.arrow}
    style={
      position.placement === 'top' || position.placement === 'bottom'
        ? { left: position.arrow }
        : { top: position.arrow }
    }
  />
);

type CardHeadProps = {
  isAnchored: boolean;
  isLast: boolean;
  number: number;
  total: number;
  onSkip: () => void;
};

const CardHead = ({
  isAnchored,
  isLast,
  number,
  total,
  onSkip,
}: CardHeadProps) => {
  if (!isAnchored) {
    return (
      <span className={s.sparkle} aria-hidden>
        {isLast ? <Check /> : <Sparkles />}
      </span>
    );
  }

  return (
    <div className={s.head}>
      <span className={s.counter}>
        {number} of {total}
      </span>
      <button
        type="button"
        className={s.close}
        aria-label="Close the tour"
        onClick={onSkip}
      >
        <X />
      </button>
    </div>
  );
};

const ProgressDots = ({
  steps,
  activeIndex,
}: {
  steps: TourStep[];
  activeIndex: number;
}) => (
  <div className={s.dots} aria-hidden>
    {steps.map((item, dotIndex) => (
      <span
        key={item.id}
        className={clsx(s.dot, dotIndex === activeIndex && s.dotActive)}
      />
    ))}
  </div>
);

type CardActionsProps = {
  step: TourStep;
  index: number;
  isLast: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
};

const CardActions = ({
  step,
  index,
  isLast,
  onBack,
  onNext,
  onSkip,
}: CardActionsProps) => {
  const primaryLabel = step.primaryLabel ?? (isLast ? 'Got it' : 'Next');

  return (
    <div className={s.actions}>
      {index > 0 && (
        <button type="button" className={s.back} onClick={onBack}>
          <ChevronLeft />
          <span>{step.secondaryLabel ?? 'Back'}</span>
        </button>
      )}
      {index === 0 && (
        <button type="button" className={s.skip} onClick={onSkip}>
          <span>{step.secondaryLabel ?? 'Skip for now'}</span>
        </button>
      )}
      <button type="button" className={s.next} onClick={onNext}>
        <span>{primaryLabel}</span>
        {!isLast && <ChevronRight />}
      </button>
    </div>
  );
};
