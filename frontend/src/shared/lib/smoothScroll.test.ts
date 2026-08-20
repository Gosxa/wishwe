// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { smoothScrollTo, smoothScrollToSelector } from './smoothScroll';

describe('smoothScroll', () => {
  let frames: Array<[number, FrameRequestCallback]>;
  let frameId: number;
  let cancelled: number[];
  let scrollTo: ReturnType<typeof vi.fn>;
  let now: number;
  let reducedMotion: boolean;

  beforeEach(() => {
    frames = [];
    frameId = 0;
    cancelled = [];
    now = 1000;
    reducedMotion = false;

    scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frameId += 1;
      frames.push([frameId, callback]);

      return frameId;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      cancelled.push(id);
      frames = frames.filter(([pending]) => pending !== id);
    });
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-reduced-motion') && reducedMotion,
      media: query,
    }));
    vi.spyOn(performance, 'now').mockImplementation(() => now);

    setScrollY(0);
  });

  afterEach(() => {
    runFramesUntilIdle();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  const setScrollY = (value: number) => {
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value,
    });
  };

  const advance = (milliseconds: number) => {
    now += milliseconds;

    const pending = frames;

    frames = [];
    pending.forEach(([, callback]) => callback(now));
  };

  const runFramesUntilIdle = () => {
    let guard = 0;

    while (frames.length && guard < 100) {
      guard += 1;
      advance(1000);
    }
  };

  const scrolledTops = () =>
    scrollTo.mock.calls.map(
      ([options]) => (options as { top: number; behavior: string }).top,
    );

  describe('smoothScrollTo', () => {
    it('does not jump before the first frame runs', () => {
      smoothScrollTo(500);

      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('eases from the current position to the target', () => {
      smoothScrollTo(1000, 700);

      advance(350);
      advance(350);

      const tops = scrolledTops();

      expect(tops).toHaveLength(2);
      expect(tops[0]).toBeCloseTo(500);
      expect(tops[1]).toBe(1000);
    });

    it('lands exactly on the target on the final frame', () => {
      smoothScrollTo(742, 700);

      advance(700);

      expect(scrolledTops().at(-1)).toBe(742);
    });

    it('never overshoots when a frame arrives late', () => {
      smoothScrollTo(1000, 700);

      advance(5000);

      expect(scrolledTops().at(-1)).toBe(1000);
    });

    it('stops requesting frames once it arrives', () => {
      smoothScrollTo(1000, 700);

      advance(700);

      expect(frames).toHaveLength(0);
    });
    it.each([
      [0.1, 4],
      [0.25, 62.5],
      [0.5, 500],
      [0.75, 937.5],
      [0.9, 996],
    ])('has eased %s of the way through to %s px', (progress, expected) => {
      smoothScrollTo(1000, 700);

      advance(700 * progress);

      expect(scrolledTops().at(-1)).toBeCloseTo(expected, 5);
    });

    it('covers the middle far faster than the edges, symmetrically', () => {
      smoothScrollTo(1000, 700);

      advance(175);
      advance(175);
      advance(175);
      advance(175);

      const [first, second, third, fourth] = scrolledTops().map(
        (top, index, tops) => top - (index ? tops[index - 1] : 0),
      );

      expect(second).toBeGreaterThan(first);
      expect(third).toBeGreaterThan(fourth);
      expect(first).toBeCloseTo(fourth, 5);
      expect(second).toBeCloseTo(third, 5);
    });

    it('scrolls upward as readily as downward', () => {
      setScrollY(1000);
      smoothScrollTo(0, 700);

      advance(700);

      expect(scrolledTops().at(-1)).toBe(0);
    });

    it('respects an offset start position', () => {
      setScrollY(200);
      smoothScrollTo(1200, 700);

      advance(350);

      expect(scrolledTops()[0]).toBeCloseTo(700);
    });

    it('does nothing when already at the target', () => {
      setScrollY(500);
      smoothScrollTo(500);

      expect(scrollTo).not.toHaveBeenCalled();
      expect(frames).toHaveLength(0);
    });

    it('jumps straight there when the user prefers reduced motion', () => {
      reducedMotion = true;
      smoothScrollTo(500);

      expect(scrollTo).toHaveBeenCalledOnce();
      expect(scrollTo).toHaveBeenCalledWith({ top: 500, behavior: 'instant' });
      expect(frames).toHaveLength(0);
    });

    it.each([0, -100])(
      'jumps straight there for a duration of %s',
      duration => {
        smoothScrollTo(500, duration);

        expect(scrollTo).toHaveBeenCalledOnce();
        expect(scrollTo).toHaveBeenCalledWith({
          top: 500,
          behavior: 'instant',
        });
      },
    );

    it('cancels an animation already in flight before starting a new one', () => {
      smoothScrollTo(1000, 700);
      advance(100);

      const inFlight = frameId;

      smoothScrollTo(2000, 700);

      expect(cancelled).toContain(inFlight);
    });

    it('finishes on the newest target when interrupted mid-scroll', () => {
      smoothScrollTo(1000, 700);
      advance(350);

      smoothScrollTo(300, 700);
      advance(700);

      expect(scrolledTops().at(-1)).toBe(300);
    });

    it('cancels an in-flight animation even when the new target is a no-op', () => {
      smoothScrollTo(1000, 700);
      advance(100);
      smoothScrollTo(0);

      expect(frames).toHaveLength(0);
    });

    it('always scrolls instantly so the easing is not fought by the browser', () => {
      smoothScrollTo(1000, 700);

      advance(350);

      expect(scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'instant' }),
      );
    });
  });

  describe('smoothScrollToSelector', () => {
    const mountTarget = (id: string, top: number) => {
      const element = document.createElement('div');

      element.id = id;
      element.getBoundingClientRect = () =>
        ({
          top,
          left: 0,
          right: 0,
          bottom: top,
          width: 0,
          height: 0,
        }) as DOMRect;
      document.body.append(element);

      return element;
    };

    it('scrolls to the element position relative to the document', () => {
      setScrollY(200);
      mountTarget('waitlist', 300);

      smoothScrollToSelector('#waitlist', 700);
      advance(700);

      expect(scrolledTops().at(-1)).toBe(500);
    });

    it('does nothing when the selector matches no element', () => {
      smoothScrollToSelector('#missing');

      expect(scrollTo).not.toHaveBeenCalled();
      expect(frames).toHaveLength(0);
    });

    it('passes the duration through to the easing loop', () => {
      mountTarget('waitlist', 1000);

      smoothScrollToSelector('#waitlist', 0);

      expect(scrollTo).toHaveBeenCalledOnce();
      expect(scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'instant' });
    });

    it('honours reduced motion through the selector entry point', () => {
      reducedMotion = true;
      mountTarget('waitlist', 400);

      smoothScrollToSelector('#waitlist');

      expect(scrollTo).toHaveBeenCalledOnce();
      expect(frames).toHaveLength(0);
    });
  });
});
