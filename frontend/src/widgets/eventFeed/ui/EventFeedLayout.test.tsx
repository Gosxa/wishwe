// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
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

  it('replaces the empty state with a retryable error after a failed load', () => {
    const onRetry = vi.fn();

    renderLayout({
      isEmpty: true,
      error: 'Failed to load events',
      onRetry,
      children: null,
    });

    const alert = screen.getByRole('alert');

    expect(alert.textContent).toContain('Failed to load events');
    expect(screen.queryByText('Empty')).toBeNull();
    expect(screen.queryByText('Event')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('prefers the spinner over the error while a retry is running', () => {
    renderLayout({
      isLoading: true,
      isEmpty: true,
      error: 'Failed to load events',
      onRetry: vi.fn(),
    });

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText('Empty')).toBeNull();
  });

  it('omits the retry button when no handler is supplied', () => {
    renderLayout({ isEmpty: true, error: 'Failed to load events' });

    expect(screen.getByRole('alert').textContent).toContain(
      'Failed to load events',
    );
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('does not observe the sentinel while an error is showing', () => {
    renderLayout({ error: 'Failed to load events', onRetry: vi.fn() });

    expect(observe).not.toHaveBeenCalled();
    expect(screen.queryByText('Event')).toBeNull();
  });

  it('shows the list again once a retry clears the error', () => {
    const view = renderLayout({
      isEmpty: true,
      error: 'Failed to load events',
      onRetry: vi.fn(),
    });

    expect(screen.getByRole('alert')).toBeTruthy();

    view.rerender(
      <EventFeedLayout {...view.props} isEmpty={false} error={null} />,
    );

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('Event')).toBeTruthy();
    expect(observe).toHaveBeenCalledOnce();
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
