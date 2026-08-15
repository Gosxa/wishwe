// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import {
  SHARE_FORMATS,
  generateShareImages,
  getShareDateParts,
  shareImageFilename,
} from './shareImage';

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

    const mockBlob = new Blob(['png-data'], { type: 'image/png' });
    const originalCreateElement = document.createElement.bind(document);

    const strokeSpy = vi.fn();
    const contextMock = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      arc: vi.fn(),
      clip: vi.fn(),
      fillRect: vi.fn(),
      fill: vi.fn(),
      stroke: strokeSpy,
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
      fillText: vi.fn(),
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

    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        if (tagName === 'canvas') {
          const canvas = originalCreateElement('canvas');

          canvas.getContext = vi.fn(
            () => contextMock as unknown as CanvasRenderingContext2D,
          ) as unknown as typeof canvas.getContext;
          canvas.toBlob = vi.fn(callback => callback(mockBlob));

          return canvas;
        }

        return originalCreateElement(tagName);
      });

    const result = await generateShareImages({
      id: '10',
      type: 'plan',
      hashtag: '#comedy',
      image: '/cover.jpg',
      title: 'Standup comedy night',
      host: { username: '@judy', avatar: null },
      date: 'Wed, 8 Jul · 20:30',
      startsAt: 0,
      createdAt: 0,
      location: 'Comedy club, Warsaw',
      description: '',
      chatLink: null,
      participantCount: 0,
      maxParticipants: 10,
      participants: [],
      userParticipationStatus: null,
    });

    expect(result).toHaveLength(3);
    expect(result.map(r => r.format)).toEqual(['poster', 'card', 'story']);
    expect(strokeSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('renders multi-line titles on poster and story while keeping card single-line', async () => {
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

    const mockBlob = new Blob(['png-data'], { type: 'image/png' });
    const originalCreateElement = document.createElement.bind(document);
    const fillTextSpy = vi.fn();

    const contextMock = {
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
      measureText: vi.fn((text: string) => ({
        width: text.length * 20,
      })),
      fillText: fillTextSpy,
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

    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        if (tagName === 'canvas') {
          const canvas = originalCreateElement('canvas');

          canvas.getContext = vi.fn(
            () => contextMock as unknown as CanvasRenderingContext2D,
          ) as unknown as typeof canvas.getContext;
          canvas.toBlob = vi.fn(callback => callback(mockBlob));

          return canvas;
        }

        return originalCreateElement(tagName);
      });

    await generateShareImages({
      id: '11',
      type: 'plan',
      hashtag: '#tech',
      image: '/cover.jpg',
      title:
        'Weekend Hackathon & Startup Pitch Competition in Berlin Tech Hub Very Long Title That Needs Wrapping Across Lines',
      host: { username: '@ivan_tech', avatar: null },
      date: 'Sat, 29 Aug · 10:00',
      startsAt: 0,
      createdAt: 0,
      location: 'HubHub Coworking Lounge',
      description: '',
      chatLink: null,
      participantCount: 0,
      maxParticipants: 10,
      participants: [],
      userParticipationStatus: null,
    });

    const fillTextCalls = fillTextSpy.mock.calls;

    const cardTitleCall = fillTextCalls.find(
      call => call[1] === 196 && call[2] === 214,
    );

    expect(cardTitleCall).toBeDefined();
    expect(cardTitleCall![0]).toContain('…');

    const posterLine1Call = fillTextCalls.find(
      call => call[1] === 48 && call[2] === 310,
    );
    const posterLine2Call = fillTextCalls.find(
      call => call[1] === 48 && call[2] === 384,
    );

    expect(posterLine1Call).toBeDefined();
    expect(posterLine2Call).toBeDefined();
    expect(posterLine2Call![0]).toContain('…');

    createElementSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('renders wish event badges with dashed outlines', async () => {
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

    const mockBlob = new Blob(['png-data'], { type: 'image/png' });
    const originalCreateElement = document.createElement.bind(document);
    const setLineDashSpy = vi.fn();

    const contextMock = {
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
      measureText: vi.fn(() => ({ width: 100 })),
      fillText: vi.fn(),
      setLineDash: setLineDashSpy,
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

    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        if (tagName === 'canvas') {
          const canvas = originalCreateElement('canvas');

          canvas.getContext = vi.fn(
            () => contextMock as unknown as CanvasRenderingContext2D,
          ) as unknown as typeof canvas.getContext;
          canvas.toBlob = vi.fn(callback => callback(mockBlob));

          return canvas;
        }

        return originalCreateElement(tagName);
      });

    await generateShareImages({
      id: '12',
      type: 'wish',
      hashtag: '#travel',
      image: '/cover.jpg',
      title: 'Trip to Tokyo',
      host: { username: '@alex', avatar: null },
      date: 'Sat, 15 Aug · 12:00',
      startsAt: 0,
      createdAt: 0,
      location: 'Tokyo, Japan',
      description: '',
      chatLink: null,
      participantCount: 0,
      maxParticipants: 10,
      participants: [],
      userParticipationStatus: null,
    });

    expect(
      setLineDashSpy.mock.calls.some(
        ([pattern]) => Array.isArray(pattern) && pattern.length > 0,
      ),
    ).toBe(true);

    createElementSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
