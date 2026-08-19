'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import clsx from 'clsx';
import { Spinner } from '@/shared';
import s from './eventFeed.module.scss';

type Props = {
  variant: 'home' | 'profile';
  before?: ReactNode;
  toolbar: ReactNode;
  isLoading: boolean;
  isEmpty: boolean;
  emptyState: ReactNode;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  children: ReactNode;
};

export const EventFeedLayout = ({
  variant,
  before,
  toolbar,
  isLoading,
  isEmpty,
  emptyState,
  isLoadingMore,
  hasMore,
  loadMore,
  children,
}: Props) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;

    if (!node || !hasMore || isLoading || isEmpty) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasMore, isEmpty, isLoading, loadMore]);

  return (
    <div className={clsx(s.feed, variant === 'home' ? s.home : s.profile)}>
      {before}

      <div className={s.toolbarSlot}>{toolbar}</div>

      {isLoading ? (
        <div className={s.statusSlot}>
          <Spinner />
        </div>
      ) : isEmpty ? (
        <div className={s.emptySlot}>{emptyState}</div>
      ) : (
        <div className={s.list}>
          {children}
          {hasMore && <div ref={sentinelRef} className={s.sentinel} />}
          {isLoadingMore && (
            <div className={s.statusSlot}>
              <Spinner inline />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
