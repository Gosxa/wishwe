// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FeedEvent } from './types';

const mocks = vi.hoisted(() => ({
  createShareLink: vi.fn(),
  generateShareImages: vi.fn(),
}));

vi.mock('@/shared/client_api/event', () => ({
  createShareLink: mocks.createShareLink,
}));

vi.mock('./shareImage', async importOriginal => {
  const actual = await importOriginal<typeof import('./shareImage')>();

  return { ...actual, generateShareImages: mocks.generateShareImages };
});

import { useShareEvent } from './useShareEvent';

const event: FeedEvent = {
  id: '42',
  type: 'plan',
  hashtag: '#travel',
  image: '/cover.jpg',
  title: 'Weekend trip',
  host: { username: '@host', avatar: null },
  date: 'Friday, August 14 @ 12:00',
  startsAt: Date.parse('2026-08-14T12:00:00Z'),
  createdAt: Date.parse('2026-08-12T12:00:00Z'),
  location: 'Kyiv, Podil',
  description: 'A short trip with friends',
  chatLink: null,
  participantCount: 1,
  maxParticipants: 10,
  participants: [],
  userParticipationStatus: null,
};

const generatedImages = () => [
  { format: 'poster' as const, blob: new Blob(['poster']) },
  { format: 'card' as const, blob: new Blob(['card']) },
  { format: 'story' as const, blob: new Blob(['story']) },
];

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(promiseResolve => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
};

describe('useShareEvent', () => {
  let clipboardWriteText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    vi.stubGlobal('ClipboardItem', undefined);

    clipboardWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWriteText },
    });
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi
        .fn()
        .mockReturnValueOnce('blob:poster')
        .mockReturnValueOnce('blob:card')
        .mockReturnValueOnce('blob:story'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });

    mocks.createShareLink.mockResolvedValue('/share/private');
    mocks.generateShareImages.mockReturnValue(new Promise(() => {}));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('reports image-generation rejection while keeping link sharing available', async () => {
    mocks.generateShareImages.mockRejectedValueOnce(new Error('canvas failed'));

    const { result } = renderHook(() => useShareEvent(event, false));

    await waitFor(() => expect(result.current.imageError).toBe(true));

    expect(result.current.activeImage).toBeNull();
    expect(result.current.socialUrls?.telegram).toContain('event%3D42');
  });

  it('revokes every prepared object URL when the hook unmounts', async () => {
    mocks.generateShareImages.mockResolvedValueOnce(generatedImages());

    const { result, unmount } = renderHook(() => useShareEvent(event, false));

    await waitFor(() => expect(result.current.activeUrl).toBe('blob:poster'));

    expect(URL.createObjectURL).toHaveBeenCalledTimes(3);
    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3);
    expect(URL.revokeObjectURL).toHaveBeenNthCalledWith(1, 'blob:poster');
    expect(URL.revokeObjectURL).toHaveBeenNthCalledWith(2, 'blob:card');
    expect(URL.revokeObjectURL).toHaveBeenNthCalledWith(3, 'blob:story');
  });

  it('does not allocate object URLs when generation settles after unmount', async () => {
    const generation = deferred<ReturnType<typeof generatedImages>>();

    mocks.generateShareImages.mockReturnValueOnce(generation.promise);

    const { unmount } = renderHook(() => useShareEvent(event, false));

    unmount();
    await act(async () => generation.resolve(generatedImages()));

    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it('announces a copy-link failure without showing false success feedback', async () => {
    clipboardWriteText.mockRejectedValueOnce(new Error('permission denied'));

    const { result } = renderHook(() => useShareEvent(event, false));

    await act(async () => result.current.handleCopyLink());

    expect(result.current.announcement).toBe(
      "Couldn't copy the link. Please try again.",
    );
    expect(result.current.feedback).toBe('idle');
    expect(result.current.showLinkToast).toBe(false);
  });

  it('resets copy feedback and clears its pending timer on unmount', async () => {
    vi.useFakeTimers();

    const { result, unmount } = renderHook(() => useShareEvent(event, false));

    await act(async () => result.current.handleCopyLink());

    expect(result.current.feedback).toBe('link');
    expect(result.current.announcement).toBe('Link copied!');
    expect(result.current.showLinkToast).toBe(true);

    await act(async () => vi.advanceTimersByTimeAsync(2_000));

    expect(result.current.feedback).toBe('idle');
    expect(result.current.announcement).toBe('');
    expect(result.current.showLinkToast).toBe(false);

    await act(async () => result.current.handleCopyLink());
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
