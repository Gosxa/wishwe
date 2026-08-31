// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  pathname: '/feed',
  sidebar: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock('@widgets/sidebar', () => ({
  Sidebar: (props: unknown) => {
    mocks.sidebar(props);

    return <nav data-testid="sidebar" />;
  },
}));

import { ProtectedSidebar } from './ProtectedSidebar';

describe('ProtectedSidebar', () => {
  beforeEach(() => {
    mocks.pathname = '/feed';
    mocks.sidebar.mockClear();
  });

  afterEach(cleanup);

  it.each([
    ['/feed', 'home', true],
    ['/friends', 'friends', true],
    ['/profile', 'profile', false],
    ['/edit-profile', 'profile', false],
    ['/user/alice', undefined, false],
    ['/share/invite-token', 'home', true],
  ])(
    'maps %s to the persistent Sidebar state',
    (pathname, activeKey, mobileFeedLayout) => {
      mocks.pathname = pathname;

      render(<ProtectedSidebar isAuthenticated />);

      expect(mocks.sidebar).toHaveBeenLastCalledWith({
        activeKey,
        mobileFeedLayout,
      });
    },
  );

  it('does not cover the anonymous shared-event landing page', () => {
    mocks.pathname = '/share/invite-token';

    const { queryByTestId } = render(
      <ProtectedSidebar isAuthenticated={false} />,
    );

    expect(queryByTestId('sidebar')).toBeNull();
    expect(mocks.sidebar).not.toHaveBeenCalled();
  });
});
