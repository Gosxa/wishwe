// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitForFeed } from './waitForFeed';

const POLL_MS = 120;
const TIMEOUT_MS = 8000;

describe('waitForFeed', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  const renderFeed = (tourId: 'feed-card' | 'feed-empty') => {
    const element = document.createElement('div');

    element.setAttribute('data-tour', tourId);
    document.body.append(element);
  };

  it('does not fire before the first poll', () => {
    const onReady = vi.fn();

    renderFeed('feed-card');
    waitForFeed(onReady);

    vi.advanceTimersByTime(POLL_MS - 1);

    expect(onReady).not.toHaveBeenCalled();
  });

  it('fires on the first poll once a feed card is rendered', () => {
    const onReady = vi.fn();

    renderFeed('feed-card');
    waitForFeed(onReady);

    vi.advanceTimersByTime(POLL_MS);

    expect(onReady).toHaveBeenCalledOnce();
  });

  it('accepts an empty feed as ready too', () => {
    const onReady = vi.fn();

    renderFeed('feed-empty');
    waitForFeed(onReady);

    vi.advanceTimersByTime(POLL_MS);

    expect(onReady).toHaveBeenCalledOnce();
  });

  it('keeps polling while the feed is still loading', () => {
    const onReady = vi.fn();

    waitForFeed(onReady);

    vi.advanceTimersByTime(POLL_MS * 5);
    expect(onReady).not.toHaveBeenCalled();

    renderFeed('feed-card');
    vi.advanceTimersByTime(POLL_MS);

    expect(onReady).toHaveBeenCalledOnce();
  });

  it('stops polling after it fires', () => {
    const onReady = vi.fn();

    renderFeed('feed-card');
    waitForFeed(onReady);

    vi.advanceTimersByTime(POLL_MS * 10);

    expect(onReady).toHaveBeenCalledOnce();
  });

  it('gives up and continues anyway once the feed never arrives', () => {
    const onReady = vi.fn();

    waitForFeed(onReady);

    vi.advanceTimersByTime(TIMEOUT_MS);
    expect(onReady).not.toHaveBeenCalled();

    vi.advanceTimersByTime(POLL_MS);
    expect(onReady).toHaveBeenCalledOnce();
  });

  it('fires only once after the timeout', () => {
    const onReady = vi.fn();

    waitForFeed(onReady);

    vi.advanceTimersByTime(TIMEOUT_MS * 2);

    expect(onReady).toHaveBeenCalledOnce();
  });

  it('cancels the poll when the caller cleans up', () => {
    const onReady = vi.fn();

    const cancel = waitForFeed(onReady);

    cancel();
    renderFeed('feed-card');
    vi.advanceTimersByTime(TIMEOUT_MS * 2);

    expect(onReady).not.toHaveBeenCalled();
  });

  it('survives a cleanup that runs after it already fired', () => {
    const onReady = vi.fn();

    renderFeed('feed-card');

    const cancel = waitForFeed(onReady);

    vi.advanceTimersByTime(POLL_MS);

    expect(() => cancel()).not.toThrow();
    expect(onReady).toHaveBeenCalledOnce();
  });
});
