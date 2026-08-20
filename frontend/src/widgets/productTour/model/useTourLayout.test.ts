// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTourLayout } from './useTourLayout';
import type { TourStep } from './types';

const CARD = { width: 300, height: 150 };

describe('useTourLayout', () => {
  let frames: Array<[number, FrameRequestCallback]>;
  let frameId: number;
  let observed: Element[];
  let disconnect: ReturnType<typeof vi.fn>;
  let notifyResize: () => void;
  let card: HTMLDivElement;

  beforeEach(() => {
    frames = [];
    frameId = 0;
    observed = [];
    disconnect = vi.fn();
    notifyResize = () => {};

    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frameId += 1;
      frames.push([frameId, callback]);

      return frameId;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      frames = frames.filter(([pending]) => pending !== id);
    });

    class ResizeObserverMock {
      constructor(callback: ResizeObserverCallback) {
        notifyResize = () => callback([], this as unknown as ResizeObserver);
      }

      observe = (target: Element) => {
        observed.push(target);
      };
      unobserve = vi.fn();
      disconnect = disconnect;
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);

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

  it('re-measures after the window resizes', () => {
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
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    flushFrames();

    expect(result.current.rect?.top).toBe(240);
  });

  it('re-measures when the page scrolls under the anchor', () => {
    const anchor = mountAnchor('feed-card', {
      top: 300,
      left: 100,
      width: 200,
      height: 50,
    });

    const { result } = setup(step({ anchor: 'feed-card', padding: 0 }));

    flushFrames();

    anchor.getBoundingClientRect = () => rectOf(120, 100, 200, 50);
    act(() => {
      document.body.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    flushFrames();

    expect(result.current.rect?.top).toBe(120);
  });

  it('re-measures when the observed layout resizes', () => {
    const anchor = mountAnchor('feed-card', {
      top: 100,
      left: 100,
      width: 200,
      height: 50,
    });

    const { result } = setup(step({ anchor: 'feed-card', padding: 0 }));

    flushFrames();

    anchor.getBoundingClientRect = () => rectOf(180, 100, 200, 50);
    act(() => notifyResize());
    flushFrames();

    expect(result.current.rect?.top).toBe(180);
  });

  it('observes the document body for layout shifts', () => {
    setup(step({ anchor: 'feed-card' }));

    expect(observed).toEqual([document.body]);
  });

  it('coalesces a burst of events into a single frame', () => {
    setup(step({ anchor: 'feed-card' }));

    act(() => {
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));
    });

    expect(frames).toHaveLength(1);
  });

  it('stops listening and disconnects the observer on unmount', () => {
    const { unmount } = setup(step({ anchor: 'feed-card' }));

    unmount();

    expect(disconnect).toHaveBeenCalledOnce();
    expect(frames).toHaveLength(0);

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(frames).toHaveLength(0);
  });
});
