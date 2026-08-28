// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { EVENT_IMAGE_FALLBACK } from '@/shared/lib/mediaFallbacks';
import type { FeedEvent } from './types';
import {
  SHARE_FORMATS,
  generateShareImages,
  getShareDateParts,
  shareImageFilename,
} from './shareImage';

const makeEvent = (overrides: Partial<FeedEvent> = {}): FeedEvent => ({
  id: '10',
  type: 'plan',
  hashtag: '#comedy',
  image: '/cover.jpg',
  title: 'Standup comedy night',
  host: { username: '@judy', avatar: null },
  date: 'Wednesday, July 8 @ 20:30',
  startsAt: 0,
  createdAt: 0,
  location: 'Comedy club, Warsaw',
  description: '',
  chatLink: null,
  participantCount: 0,
  maxParticipants: 10,
  participants: [],
  userParticipationStatus: null,
  ...overrides,
});

const installCanvasMock = (
  measureText: (text: string) => number = () => 100,
  options: { contextAvailable?: boolean; blob?: Blob | null } = {},
) => {
  class MockImage {
    width = 100;
    height = 100;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_: string) {
      setTimeout(() => this.onload?.(), 0);
    }
  }

  vi.stubGlobal('Image', MockImage);

  const fillText = vi.fn<(text: string, x: number, y: number) => void>();
  const context = {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    clip: vi.fn(),
    fillRect: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: measureText(text) })),
    fillText,
    setLineDash: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    drawImage: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
    font: '',
    textAlign: '',
    textBaseline: '',
    globalAlpha: 1,
  };
  const originalCreateElement = document.createElement.bind(document);

  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName !== 'canvas') return originalCreateElement(tagName);

    const canvas = originalCreateElement('canvas');

    Object.defineProperty(canvas, 'getContext', {
      value: vi.fn(() => (options.contextAvailable === false ? null : context)),
    });
    canvas.toBlob = vi.fn(callback =>
      callback(
        options.blob === undefined
          ? new Blob(['png-data'], { type: 'image/png' })
          : options.blob,
      ),
    );

    return canvas;
  });

  return context;
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('share image metadata', () => {
  it('keeps the three Figma export sizes in carousel order', () => {
    expect(
      SHARE_FORMATS.map(({ id, width, height }) => ({ id, width, height })),
    ).toEqual([
      { id: 'poster', width: 1200, height: 630 },
      { id: 'card', width: 1200, height: 630 },
      { id: 'story', width: 1080, height: 1920 },
    ]);
  });

  it('shortens feed dates without changing their displayed time', () => {
    expect(getShareDateParts('Friday, August 14 @ 19:30')).toEqual({
      date: 'Fri, 14 Aug',
      time: '19:30',
    });
    expect(getShareDateParts('Someday')).toEqual({
      date: 'Someday',
      time: '',
    });
  });

  it('creates a safe and format-specific PNG name', () => {
    expect(
      shareImageFilename(
        { id: '42', title: 'Dinner & Drinks in Kyiv!' },
        'story',
      ),
    ).toBe('wishwe-dinner-drinks-in-kyiv-story.png');
  });

  it('generates share images for events where the host has no avatar', async () => {
    const context = installCanvasMock();
    const result = await generateShareImages(makeEvent());

    expect(result).toHaveLength(3);
    expect(result.map(r => r.format)).toEqual(['poster', 'card', 'story']);
    expect(context.stroke).toHaveBeenCalled();
  });

  it('uses the bundled placeholder when the cover fails to load', async () => {
    installCanvasMock();
    const sources: string[] = [];

    class MockImage {
      width = 100;
      height = 100;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(source: string) {
        sources.push(source);
        setTimeout(() => {
          if (source === '/missing-cover.jpg') {
            this.onerror?.();
          } else {
            this.onload?.();
          }
        }, 0);
      }
    }

    vi.stubGlobal('Image', MockImage);

    await generateShareImages(makeEvent({ image: '/missing-cover.jpg' }));

    expect(sources).toContain(EVENT_IMAGE_FALLBACK);
  });

  it('rejects image generation when a 2D canvas context is unavailable', async () => {
    installCanvasMock(undefined, { contextAvailable: false });

    await expect(generateShareImages(makeEvent())).rejects.toThrow(
      'Canvas rendering is not supported.',
    );
  });

  it('rejects image generation when the canvas produces no PNG blob', async () => {
    installCanvasMock(undefined, { blob: null });

    await expect(generateShareImages(makeEvent())).rejects.toThrow(
      'Could not render the share image.',
    );
  });

  it('renders multi-line titles on poster and story while keeping card single-line', async () => {
    const context = installCanvasMock(text => text.length * 20);

    await generateShareImages(
      makeEvent({
        id: '11',
        hashtag: '#tech',
        title:
          'Weekend Hackathon & Startup Pitch Competition in Berlin Tech Hub Very Long Title That Needs Wrapping Across Lines',
        host: { username: '@ivan_tech', avatar: null },
        date: 'Saturday, August 29 @ 10:00',
        location: 'HubHub Coworking Lounge',
      }),
    );

    const fillTextCalls = context.fillText.mock.calls;

    const cardTitleCall = fillTextCalls.find(
      call => call[1] === 196 && call[2] === 214,
    );

    expect(cardTitleCall?.[0]).toContain('…');
    const posterLine1Call = fillTextCalls.find(
      call => call[1] === 48 && call[2] === 310,
    );
    const posterLine2Call = fillTextCalls.find(
      call => call[1] === 48 && call[2] === 384,
    );

    expect(posterLine1Call).toBeDefined();
    expect(posterLine2Call?.[0]).toContain('…');
  });

  it('keeps fallback-cover branding legible without darkening titles', async () => {
    const context = installCanvasMock();
    const colors: Record<string, string[]> = { WishWe: [], Title: [] };

    context.fillText.mockImplementation(text => {
      if (text in colors) colors[text].push(context.fillStyle);
    });

    await generateShareImages(
      makeEvent({ image: '/bg-gradient-noise.webp', title: 'Title' }),
    );

    expect(colors.WishWe).toEqual(['#474b24', '#474b24', '#474b24']);
    expect(colors.Title).toEqual(['#f7f3e3', '#1a1c1e', '#f7f3e3']);
  });

  it('renders wish event badges with dashed outlines', async () => {
    const context = installCanvasMock();

    await generateShareImages(
      makeEvent({
        id: '12',
        type: 'wish',
        hashtag: '#travel',
        title: 'Trip to Tokyo',
        host: { username: '@alex', avatar: null },
        date: 'One day this winter',
        location: 'Tokyo, Japan',
      }),
    );

    expect(
      context.setLineDash.mock.calls.some(
        ([pattern]) => Array.isArray(pattern) && pattern.length > 0,
      ),
    ).toBe(true);
  });
});
