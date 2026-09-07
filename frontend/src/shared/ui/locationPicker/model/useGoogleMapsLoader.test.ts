// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authListener: null as (() => void) | null,
  hasMapsAuthFailed: vi.fn(() => false),
  isMapsConfigured: vi.fn(() => true),
  loadGoogleMaps: vi.fn(),
  onMapsAuthFailure: vi.fn(),
  resetGoogleMapsLoader: vi.fn(),
  trackLocationPicker: vi.fn(),
}));

vi.mock('@/shared/lib/googleMaps/loadGoogleMaps', () => ({
  hasMapsAuthFailed: mocks.hasMapsAuthFailed,
  isMapsConfigured: mocks.isMapsConfigured,
  loadGoogleMaps: mocks.loadGoogleMaps,
  MAPS_SLOW_MS: 3000,
  onMapsAuthFailure: mocks.onMapsAuthFailure,
  resetGoogleMapsLoader: mocks.resetGoogleMapsLoader,
}));

vi.mock('@/shared/lib/googleMaps/analytics', () => ({
  trackLocationPicker: mocks.trackLocationPicker,
}));

import type { MapsLibraries } from '@/shared/lib/googleMaps/loadGoogleMaps';
import { useGoogleMapsLoader } from './useGoogleMapsLoader';

const libraries = { maps: {} } as MapsLibraries;

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

const settle = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe('useGoogleMapsLoader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.authListener = null;
    mocks.hasMapsAuthFailed.mockReturnValue(false);
    mocks.isMapsConfigured.mockReturnValue(true);
    mocks.onMapsAuthFailure.mockImplementation(listener => {
      mocks.authListener = listener;

      return () => {
        if (mocks.authListener === listener) mocks.authListener = null;
      };
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('owns slow-load feedback until the SDK becomes ready', async () => {
    const load = deferred<MapsLibraries>();

    mocks.loadGoogleMaps.mockReturnValue(load.promise);

    const { result } = renderHook(() => useGoogleMapsLoader());

    expect(result.current.status).toBe('loading');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2999);
    });
    expect(result.current.isSlow).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(result.current.isSlow).toBe(true);

    await act(async () => {
      load.resolve(libraries);
      await load.promise;
    });

    expect(result.current).toMatchObject({
      libraries,
      status: 'loaded',
      isSlow: false,
    });
  });

  it('resets the SDK loader and starts a fresh request after failure', async () => {
    mocks.loadGoogleMaps
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(libraries);

    const { result } = renderHook(() => useGoogleMapsLoader());

    await settle();
    expect(result.current.status).toBe('failed');

    act(() => result.current.retryLoad());

    expect(mocks.resetGoogleMapsLoader).toHaveBeenCalledOnce();
    expect(result.current.status).toBe('loading');

    await settle();

    expect(mocks.loadGoogleMaps).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('loaded');
    expect(result.current.libraries).toBe(libraries);
  });

  it('does not let a pending load overwrite an authentication failure', async () => {
    const load = deferred<MapsLibraries>();

    mocks.loadGoogleMaps.mockReturnValue(load.promise);

    const { result } = renderHook(() => useGoogleMapsLoader());

    act(() => mocks.authListener?.());
    expect(result.current.status).toBe('failed');

    await act(async () => {
      load.resolve(libraries);
      await load.promise;
    });

    expect(result.current.status).toBe('failed');
    expect(result.current.libraries).toBeNull();
  });
});
