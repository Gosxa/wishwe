'use client';

import { useState, type AnimationEvent, type ReactNode } from 'react';
import clsx from 'clsx';
import s from './eventFeed.module.scss';

type Props = {
  reveal?: boolean;
  children: ReactNode;
};

export const EventFeedItem = ({ reveal = false, children }: Props) => {
  const [isRevealing, setIsRevealing] = useState(reveal);

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) setIsRevealing(false);
  };

  return (
    <div
      className={clsx(s.item, isRevealing && s.itemRevealing)}
      onAnimationEnd={isRevealing ? handleAnimationEnd : undefined}
    >
      <div className={s.itemBody}>{children}</div>
    </div>
  );
};
