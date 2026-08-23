// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTourLayout } from './useTourLayout';
import type { TourStep } from './types';

const CARD = { width: 300, height: 150 };

describe('useTourLayout', () => {
  let frames: Array<[number, FrameRequestCallback]>;
  let frameId: number;
  let card: HTMLDivElement;

  beforeEach(() => {
    frames = [];
    frameId = 0;

    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frameId += 1;
      frames.push([frameId, callback]);

      return frameId;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      frames = frames.filter(([pending]) => pending !== id);
    });

    card = document.createElement('div');
    card.getBoundingClientRect = () => rectOf(0, 0, CARD.width, CARD.height);
    document.body.append(card);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  const rectOf = (top: number, left: number, width: number, height: number) =>
    ({
      top,
      left,
      right: left + width,
      bottom: top + height,
      width,
      height,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;

  const mountAnchor = (
    tourId: string,
    box: { top: number; left: number; width: number; height: number },
  ) => {
    const element = document.createElement('div');

    element.setAttribute('data-tour', tourId);
    element.getBoundingClientRect = () =>
      rectOf(box.top, box.left, box.width, box.height);
    document.body.append(element);

    return element;
  };

  const flushFrames = () =>
    act(() => {
      const pending = frames;

      frames = [];
      pending.forEach(([, callback]) => callback(0));
    });

  const setup = (step: TourStep | undefined) =>
    renderHook(() => useTourLayout(step, { current: card }));

  const step = (overrides: Partial<TourStep> = {}): TourStep => ({
    id: 'step',
    title: 'Title',
    body: 'Body',
    ...overrides,
  });

  it('measures nothing before the first frame runs', () => {
    const { result } = setup(step({ anchor: 'feed-card' }));

    expect(result.current.rect).toBeNull();
    expect(result.current.position).toBeNull();
  });

  it('measures the anchor and places the card next to it', () => {
    mountAnchor('feed-card', { top: 100, left: 100, width: 200, height: 50 });

    const { result } = setup(step({ anchor: 'feed-card', padding: 0 }));

    flushFrames();

    expect(result.current.rect).toMatchObject({
      top: 100,
      left: 100,
      width: 200,
      height: 50,
    });
    expect(result.current.position).toMatchObject({
      placement: 'bottom',
      top: 166,
    });
  });

  it('honours the placement the step asks for', () => {
    mountAnchor('feed-card', { top: 300, left: 400, width: 100, height: 50 });

    const { result } = setup(
      step({ anchor: 'feed-card', placement: 'top', padding: 0 }),
    );

    flushFrames();

    expect(result.current.position?.placement).toBe('top');
  });

  it('centres an anchorless step in the viewport', () => {
    const { result } = setup(step());

    flushFrames();

    expect(result.current.position).toEqual({
      top: (window.innerHeight - CARD.height) / 2,
      left: (window.innerWidth - CARD.width) / 2,
      placement: 'bottom',
      arrow: -1,
    });
  });

  it('collapses the spotlight to the viewport centre for an anchorless step', () => {
    const { result } = setup(step());

    flushFrames();

    expect(result.current.rect).toEqual({
      top: window.innerHeight / 2,
      left: window.innerWidth / 2,
      width: 0,
      height: 0,
      radius: 0,
    });
  });

  it('falls back to the viewport centre when the anchor is missing', () => {
    const { result } = setup(step({ anchor: 'not-rendered' }));

    flushFrames();

    expect(result.current.rect).toMatchObject({ width: 0, height: 0 });
  });

  it('does nothing at all without a step', () => {
    const { result } = setup(undefined);

    flushFrames();

    expect(result.current.rect).toBeNull();
    expect(result.current.position).toBeNull();
  });

  it('re-measures when the step changes', () => {
    mountAnchor('first', { top: 100, left: 100, width: 200, height: 50 });
    mountAnchor('second', { top: 400, left: 100, width: 200, height: 50 });

    const { result, rerender } = renderHook(
      ({ current }) => useTourLayout(current, { current: card }),
      { initialProps: { current: step({ anchor: 'first', padding: 0 }) } },
    );

    flushFrames();
    expect(result.current.rect?.top).toBe(100);

    rerender({ current: step({ anchor: 'second', padding: 0 }) });
    flushFrames();

    expect(result.current.rect?.top).toBe(400);
  });

  it('tracks the anchor as it moves, without any event firing', () => {
    const anchor = mountAnchor('feed-card', {
      top: 100,
      left: 100,
      width: 200,
      height: 50,
    });

    const { result } = setup(step({ anchor: 'feed-card', padding: 0 }));

    flushFrames();
    expect(result.current.rect?.top).toBe(100);

    anchor.getBoundingClientRect = () => rectOf(240, 100, 200, 50);
    flushFrames();

    expect(result.current.rect?.top).toBe(240);
  });

  it('picks up an anchor that appears after the first frame', () => {
    const { result } = setup(step({ anchor: 'feed-card', padding: 0 }));

    flushFrames();
    expect(result.current.hasAnchor).toBe(false);

    mountAnchor('feed-card', { top: 60, left: 40, width: 120, height: 40 });
    flushFrames();

    expect(result.current.hasAnchor).toBe(true);
    expect(result.current.rect?.top).toBe(60);
  });

  it('keeps the same rect and position references while nothing moves', () => {
    mountAnchor('feed-card', { top: 100, left: 100, width: 200, height: 50 });

    const { result } = setup(step({ anchor: 'feed-card', padding: 0 }));

    flushFrames();

    const { rect, position } = result.current;

    flushFrames();
    flushFrames();

    expect(result.current.rect).toBe(rect);
    expect(result.current.position).toBe(position);
  });

  it('keeps exactly one frame scheduled at a time', () => {
    setup(step({ anchor: 'feed-card' }));

    expect(frames).toHaveLength(1);

    flushFrames();

    expect(frames).toHaveLength(1);
  });

  it('cancels the polling loop on unmount', () => {
    const { unmount } = setup(step({ anchor: 'feed-card' }));

    flushFrames();
    unmount();

    expect(frames).toHaveLength(0);
  });
});
