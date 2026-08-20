// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import {
  TOUR_ATTR,
  centerRect,
  findAnchors,
  isStepAvailable,
  measureAnchors,
  placeCard,
} from './geometry';
import type { AnchorRect, TourStep } from './types';

const mountAnchor = (
  tourId: string,
  box: { top: number; left: number; width: number; height: number },
  radius = '',
) => {
  const element = document.createElement('div');

  element.setAttribute(TOUR_ATTR, tourId);
  element.style.borderTopLeftRadius = radius;
  element.getBoundingClientRect = () =>
    ({
      top: box.top,
      left: box.left,
      right: box.left + box.width,
      bottom: box.top + box.height,
      width: box.width,
      height: box.height,
      x: box.left,
      y: box.top,
      toJSON: () => ({}),
    }) as DOMRect;

  document.body.append(element);

  return element;
};

const step = (overrides: Partial<TourStep> = {}): TourStep => ({
  id: 'step',
  title: 'Title',
  body: 'Body',
  ...overrides,
});

const viewport = { width: 1000, height: 800 };
const card = { width: 300, height: 150 };

describe('findAnchors', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns nothing when the step has no anchor', () => {
    mountAnchor('feed-card', { top: 0, left: 0, width: 100, height: 40 });

    expect(findAnchors(undefined)).toEqual([]);
  });

  it('finds every element carrying the anchor key', () => {
    const first = mountAnchor('feed-card', {
      top: 0,
      left: 0,
      width: 100,
      height: 40,
    });
    const second = mountAnchor('feed-card', {
      top: 60,
      left: 0,
      width: 100,
      height: 40,
    });

    mountAnchor('other', { top: 0, left: 0, width: 100, height: 40 });

    expect(findAnchors('feed-card')).toEqual([first, second]);
  });

  it('skips collapsed elements so a hidden anchor never wins', () => {
    mountAnchor('feed-card', { top: 0, left: 0, width: 0, height: 0 });

    expect(findAnchors('feed-card')).toEqual([]);
  });

  it('returns an empty list when the key is nowhere in the DOM', () => {
    expect(findAnchors('missing')).toEqual([]);
  });

  it('takes the first key of a list that actually resolves', () => {
    const fallback = mountAnchor('second-choice', {
      top: 0,
      left: 0,
      width: 100,
      height: 40,
    });

    mountAnchor('first-choice', { top: 0, left: 0, width: 0, height: 0 });

    expect(findAnchors(['first-choice', 'second-choice'])).toEqual([fallback]);
  });

  it('prefers the earlier key when both resolve', () => {
    const preferred = mountAnchor('first-choice', {
      top: 0,
      left: 0,
      width: 100,
      height: 40,
    });

    mountAnchor('second-choice', { top: 0, left: 0, width: 100, height: 40 });

    expect(findAnchors(['first-choice', 'second-choice'])).toEqual([preferred]);
  });

  it('escapes keys so a selector-special character cannot break the query', () => {
    const element = mountAnchor('feed.card:1', {
      top: 0,
      left: 0,
      width: 100,
      height: 40,
    });

    expect(findAnchors('feed.card:1')).toEqual([element]);
  });
});

describe('isStepAvailable', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('treats an anchorless step as always available', () => {
    expect(isStepAvailable(step())).toBe(true);
  });

  it('is available once the anchor is on screen', () => {
    mountAnchor('feed-card', { top: 0, left: 0, width: 100, height: 40 });

    expect(isStepAvailable(step({ anchor: 'feed-card' }))).toBe(true);
  });

  it('is unavailable while the anchor is missing', () => {
    expect(isStepAvailable(step({ anchor: 'feed-card' }))).toBe(false);
  });
});

describe('measureAnchors', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('pads a single anchor by the default 8px', () => {
    const element = mountAnchor('a', {
      top: 100,
      left: 50,
      width: 200,
      height: 40,
    });

    expect(measureAnchors([element], step())).toEqual({
      top: 92,
      left: 42,
      width: 216,
      height: 56,
      radius: 8,
    });
  });

  it('wraps every anchor in one bounding box', () => {
    const first = mountAnchor('a', {
      top: 100,
      left: 50,
      width: 100,
      height: 40,
    });
    const second = mountAnchor('a', {
      top: 120,
      left: 200,
      width: 60,
      height: 40,
    });

    expect(measureAnchors([first, second], step())).toMatchObject({
      top: 92,
      left: 42,
      width: 226,
      height: 76,
    });
  });

  it('honours a per-step padding override', () => {
    const element = mountAnchor('a', {
      top: 100,
      left: 50,
      width: 200,
      height: 40,
    });

    expect(measureAnchors([element], step({ padding: 0 }))).toEqual({
      top: 100,
      left: 50,
      width: 200,
      height: 40,
      radius: 0,
    });
  });

  it('adds the padding to the radius the element already has', () => {
    const element = mountAnchor(
      'a',
      { top: 100, left: 50, width: 200, height: 40 },
      '12px',
    );

    expect(measureAnchors([element], step()).radius).toBe(20);
  });

  it('falls back to a zero radius when the element has none', () => {
    const element = mountAnchor('a', {
      top: 0,
      left: 0,
      width: 10,
      height: 10,
    });

    expect(measureAnchors([element], step({ padding: 0 })).radius).toBe(0);
  });

  it('lets the step pin the radius outright', () => {
    const element = mountAnchor(
      'a',
      { top: 0, left: 0, width: 10, height: 10 },
      '12px',
    );

    expect(measureAnchors([element], step({ radius: 99 })).radius).toBe(99);
  });
});

describe('centerRect', () => {
  it('collapses to the middle of the viewport', () => {
    expect(centerRect()).toEqual({
      top: window.innerHeight / 2,
      left: window.innerWidth / 2,
      width: 0,
      height: 0,
      radius: 0,
    });
  });
});

describe('placeCard', () => {
  const rect = (overrides: Partial<AnchorRect> = {}): AnchorRect => ({
    top: 100,
    left: 100,
    width: 200,
    height: 50,
    radius: 0,
    ...overrides,
  });

  it('uses the preferred placement when the card fits', () => {
    expect(placeCard(rect(), card, 'bottom', viewport)).toEqual({
      top: 166,
      left: 50,
      placement: 'bottom',
      arrow: 150,
    });
  });

  it('flips to the opposite side when the preferred one overflows', () => {
    const position = placeCard(rect({ top: 300 }), card, 'bottom', {
      width: 1000,
      height: 400,
    });

    expect(position).toEqual({
      top: 134,
      left: 50,
      placement: 'top',
      arrow: 150,
    });
  });

  it('falls back to a side that fits when neither the preferred nor its opposite do', () => {
    const position = placeCard(
      rect({ top: 20, left: 100, width: 100, height: 360 }),
      card,
      'top',
      { width: 1000, height: 400 },
    );

    expect(position.placement).toBe('right');
  });

  it('keeps the preferred placement when nothing fits at all', () => {
    const position = placeCard(
      rect({ top: 100, left: 100, width: 20, height: 20 }),
      card,
      'bottom',
      { width: 200, height: 200 },
    );

    expect(position).toEqual({
      top: 136,
      left: 20,
      placement: 'bottom',
      arrow: 90,
    });
  });

  it('offsets sideways and centres vertically for a right placement', () => {
    const position = placeCard(
      rect({ top: 100, left: 100, width: 100, height: 100 }),
      { width: 200, height: 100 },
      'right',
      viewport,
    );

    expect(position).toEqual({
      top: 100,
      left: 216,
      placement: 'right',
      arrow: 50,
    });
  });

  it('never lets the card cross the left viewport margin', () => {
    const position = placeCard(rect({ left: 0, width: 10 }), card, 'bottom', {
      width: 1000,
      height: 800,
    });

    expect(position.left).toBe(20);
  });

  it('never lets the card cross the right viewport margin', () => {
    const position = placeCard(rect({ left: 980, width: 10 }), card, 'bottom', {
      width: 1000,
      height: 800,
    });

    expect(position.left).toBe(680);
  });

  it('pins the card to the margin when the viewport is narrower than the card', () => {
    const position = placeCard(rect(), card, 'bottom', {
      width: 200,
      height: 800,
    });

    expect(position.left).toBe(20);
  });

  it('clamps the arrow to the near inset when the anchor sits off the card', () => {
    const position = placeCard(rect({ left: 0, width: 10 }), card, 'bottom', {
      width: 1000,
      height: 800,
    });

    expect(position.arrow).toBe(28);
  });

  it('clamps the arrow to the far inset on the opposite overhang', () => {
    const position = placeCard(rect({ left: 980, width: 10 }), card, 'bottom', {
      width: 1000,
      height: 800,
    });

    expect(position.arrow).toBe(card.width - 28);
  });

  it('keeps the arrow inside the card height for a side placement', () => {
    const position = placeCard(
      rect({ top: 0, left: 100, width: 100, height: 10 }),
      { width: 200, height: 100 },
      'right',
      viewport,
    );

    expect(position.arrow).toBeGreaterThanOrEqual(28);
    expect(position.arrow).toBeLessThanOrEqual(100 - 28);
  });
});
