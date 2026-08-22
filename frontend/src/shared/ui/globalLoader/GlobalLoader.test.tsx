// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isLoading: false,
  pathname: '/feed',
  setLoading: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock('@/shared/store/useLoadingStore', () => ({
  useLoadingStore: (
    selector: (state: {
      isLoading: boolean;
      setLoading: (value: boolean) => void;
    }) => unknown,
  ) =>
    selector({
      isLoading: mocks.isLoading,
      setLoading: mocks.setLoading,
    }),
}));

vi.mock('@/shared/ui/spinner/Spinner', () => ({
  Spinner: ({ fullscreen }: { fullscreen?: boolean }) => (
    <div data-testid="spinner" data-fullscreen={String(fullscreen)} />
  ),
}));

import { GlobalLoader } from './GlobalLoader';

describe('GlobalLoader', () => {
  beforeEach(() => {
    mocks.isLoading = false;
    mocks.pathname = '/feed';
    mocks.setLoading.mockReset();
  });

  afterEach(cleanup);

  it('shows the fullscreen spinner during navigation', () => {
    mocks.isLoading = true;

    render(<GlobalLoader />);

    expect(screen.getByTestId('spinner').dataset.fullscreen).toBe('true');
    expect(mocks.setLoading).toHaveBeenCalledWith(false);
  });

  it.each(['/onboard', '/invite/token-123/join', '/invite/token-123/join/'])(
    'does not cover a route that owns its loader: %s',
    pathname => {
      mocks.isLoading = true;
      mocks.pathname = pathname;

      render(<GlobalLoader />);

      expect(screen.queryByTestId('spinner')).toBeNull();
      expect(mocks.setLoading).toHaveBeenCalledWith(false);
    },
  );

  it('stays hidden when no navigation is pending', () => {
    render(<GlobalLoader />);

    expect(screen.queryByTestId('spinner')).toBeNull();
  });
});
