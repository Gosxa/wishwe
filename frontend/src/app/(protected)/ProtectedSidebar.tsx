'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@widgets/sidebar';

type Props = {
  isAuthenticated: boolean;
};

const pathMatches = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

const getActiveKey = (pathname: string) => {
  if (pathMatches(pathname, '/feed') || pathMatches(pathname, '/share')) {
    return 'home';
  }

  if (pathMatches(pathname, '/friends')) {
    return 'friends';
  }

  if (
    pathMatches(pathname, '/profile') ||
    pathMatches(pathname, '/edit-profile')
  ) {
    return 'profile';
  }

  return undefined;
};

export const ProtectedSidebar = ({ isAuthenticated }: Props) => {
  const pathname = usePathname();
  const isSharedEvent = pathMatches(pathname, '/share');

  if (isSharedEvent && !isAuthenticated) {
    return null;
  }

  const activeKey = getActiveKey(pathname);

  return (
    <Sidebar activeKey={activeKey} mobileFeedLayout={activeKey === 'home'} />
  );
};
