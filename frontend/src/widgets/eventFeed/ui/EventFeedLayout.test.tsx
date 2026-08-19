// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventFeedLayout } from './EventFeedLayout';

describe('EventFeedLayout', () => {
  const observe = vi.fn();
  const disconnect = vi.fn();
  let intersectionCallback: IntersectionObserverCallback = () => {};

  beforeEach(() => {
    class IntersectionObserverMock {
      readonly root = null;
      readonly rootMargin = '0px';
      readonly thresholds = [0];

      constructor(callback: IntersectionObserverCallback) {
        intersectionCallback = callback;
      }

      observe = observe;
      disconnect = disconnect;
      unobserve = vi.fn();
      takeRecords = () => [];
    }

    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  const renderLayout = (
    overrides: Partial<React.ComponentProps<typeof EventFeedLayout>> = {},
  ) => {
    const props: React.ComponentProps<typeof EventFeedLayout> = {
      variant: 'home',
      toolbar: <div>Toolbar</div>,
      isLoading: false,
      isEmpty: false,
      emptyState: <div>Empty</div>,
      isLoadingMore: false,
      hasMore: true,
      loadMore: vi.fn(),
      children: <div>Event</div>,
      ...overrides,
    };

    return { ...render(<EventFeedLayout {...props} />), props };
  };

  it('loads another page when the sentinel intersects', () => {
    const { props } = renderLayout();

    expect(observe).toHaveBeenCalledOnce();

    act(() => {
      intersectionCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    expect(props.loadMore).toHaveBeenCalledOnce();
  });

  it('starts observing after a reload makes the list visible again', () => {
    const view = renderLayout({ isLoading: true });

    expect(screen.queryByText('Event')).toBeNull();
    expect(observe).not.toHaveBeenCalled();

    view.rerender(<EventFeedLayout {...view.props} isLoading={false} />);

    expect(screen.getByText('Event')).not.toBeNull();
    expect(observe).toHaveBeenCalledOnce();
  });
});
