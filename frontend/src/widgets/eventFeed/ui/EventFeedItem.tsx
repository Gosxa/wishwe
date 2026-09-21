'use client';

import {
  useState,
  type AnimationEvent,
  type CSSProperties,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import s from './eventFeed.module.scss';

export type EventFeedItemEnter = 'left' | 'fade' | 'right';

type Props = {
  reveal?: boolean;
  enter?: EventFeedItemEnter;
  enterIndex?: number;
  children: ReactNode;
};

const ENTER_CLASS: Record<EventFeedItemEnter, string> = {
  left: s.itemEnterLeft,
  fade: s.itemEnterFade,
  right: s.itemEnterRight,
};

const ENTER_STAGGER_MS = 45;
const ENTER_MAX_INDEX = 6;

export const EventFeedItem = ({
  reveal = false,
  enter,
  enterIndex = 0,
  children,
}: Props) => {
  const [isRevealing, setIsRevealing] = useState(reveal);
  const [isEntering, setIsEntering] = useState(Boolean(enter) && !reveal);

  const handleRevealEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) setIsRevealing(false);
  };

  const handleEnterEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) setIsEntering(false);
  };

  const enterClass = isEntering && enter ? ENTER_CLASS[enter] : null;

  const style = enterClass
    ? ({
        '--item-enter-delay': `${
          Math.min(enterIndex, ENTER_MAX_INDEX) * ENTER_STAGGER_MS
        }ms`,
      } as CSSProperties)
    : undefined;

  return (
    <div
      className={clsx(s.item, isRevealing && s.itemRevealing, enterClass)}
      style={style}
      onAnimationEnd={isRevealing ? handleRevealEnd : undefined}
    >
      <div
        className={s.itemBody}
        onAnimationEnd={isEntering ? handleEnterEnd : undefined}
      >
        {children}
      </div>
    </div>
  );
};
