'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/shared/store/useUserStore';
import { useNotificationCountStore } from '@/shared/store/useNotificationCountStore';
import { useCreateEventStore } from '@/shared/store/useCreateEventStore';
import { BellDot, Plus } from '@shared/ui/icons';
import { navConfig } from '../model/navConfig';
import { NavItem } from './NavItem';
import s from '../sidebar.module.scss';

type Props = {
  activeKey?: string;
  mobileFeedLayout?: boolean;
};

type IndicatorRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

export const Sidebar = ({ activeKey, mobileFeedLayout = false }: Props) => {
  const avatar = useUserStore(state => state.user?.avatar) ?? null;
  const openCreate = useCreateEventStore(state => state.open);
  const unreadCount = useNotificationCountStore(state => state.unreadCount);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicatorRect, setIndicatorRect] = useState<IndicatorRect | null>(
    null,
  );

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const activeItem = activeKey ? itemRefs.current[activeKey] : null;

      if (!activeItem) {
        setIndicatorRect(null);

        return;
      }

      const nextRect = {
        height: activeItem.offsetHeight,
        left: activeItem.offsetLeft,
        top: activeItem.offsetTop,
        width: activeItem.offsetWidth,
      };

      setIndicatorRect(current => {
        if (
          current?.height === nextRect.height &&
          current.left === nextRect.left &&
          current.top === nextRect.top &&
          current.width === nextRect.width
        ) {
          return current;
        }

        return nextRect;
      });
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);

    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeKey, mobileFeedLayout]);

  return (
    <nav
      aria-label="Primary"
      data-indicator-ready={indicatorRect ? 'true' : undefined}
      className={
        mobileFeedLayout ? `${s.sidebar} ${s.mobileFeedLayout}` : s.sidebar
      }
    >
      {indicatorRect && (
        <span
          aria-hidden="true"
          className={s.activeIndicator}
          data-testid="sidebar-active-indicator"
          style={{
            height: indicatorRect.height,
            transform: `translate3d(${indicatorRect.left}px, ${indicatorRect.top}px, 0)`,
            width: indicatorRect.width,
          }}
        />
      )}
      {navConfig.map(item => (
        <NavItem
          key={item.key}
          Icon={item.Icon}
          label={item.label}
          href={item.href}
          isActive={item.key === activeKey}
          avatarUrl={item.key === 'profile' ? avatar : null}
          tourId={`nav-${item.key}`}
          itemRef={element => {
            itemRefs.current[item.key] = element;
          }}
        />
      ))}
      {mobileFeedLayout && (
        <>
          <button
            type="button"
            className={s.mobileCreate}
            aria-label="Create"
            onClick={() => openCreate()}
          >
            <Plus />
          </button>
          <Link
            href="/activity"
            className={`${s.navItem} ${s.mobileActivity} ${activeKey === 'activity' ? s.active : ''}`}
            aria-current={activeKey === 'activity' ? 'page' : undefined}
            aria-label={`Activity${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            <BellDot hasUnread={unreadCount > 0} />
            <span className={s.label}>Activity</span>
          </Link>
        </>
      )}
    </nav>
  );
};
