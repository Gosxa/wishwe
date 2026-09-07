// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MapsLibraries } from '@/shared/lib/googleMaps/loadGoogleMaps';
import type { ResolvedLocation } from './types';

const mocks = vi.hoisted(() => ({
  reverseGeocode: vi.fn(),
  trackLocationPicker: vi.fn(),
}));

vi.mock('@/shared/lib/googleMaps/placesService', () => ({
  reverseGeocode: mocks.reverseGeocode,
}));

vi.mock('@/shared/lib/googleMaps/analytics', () => ({
  trackLocationPicker: mocks.trackLocationPicker,
}));

import { usePinGeocodeWorkflow } from './usePinGeocodeWorkflow';

const libraries = { geocoding: {} } as MapsLibraries;

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

const location = (
  lat: number,
  lng: number,
  formattedAddress: string,
): ResolvedLocation => ({
  place: { lat, lng, formattedAddress },
  parts: {},
});

const advanceGeocodeDelay = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
  });
};

describe('usePinGeocodeWorkflow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('ignores a stale geocode that resolves after the latest point', async () => {
    const first = deferred<ResolvedLocation>();
    const second = deferred<ResolvedLocation>();

    mocks.reverseGeocode
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { result } = renderHook(() =>
      usePinGeocodeWorkflow({ initialPin: null, libraries }),
    );

    act(() => result.current.handleMapPick({ lat: 50.4, lng: 30.5 }, 16));
    await advanceGeocodeDelay();

    act(() => result.current.handleMapPick({ lat: 49.8, lng: 24.0 }, 16));
    await advanceGeocodeDelay();

    await act(async () => {
      second.resolve(location(49.8, 24.0, 'Rynok Square, Lviv, Ukraine'));
      await second.promise;
    });

    expect(result.current.formatted?.value).toBe('Rynok Square, Lviv, Ukraine');

    await act(async () => {
      first.resolve(location(50.4, 30.5, 'Old address, Kyiv, Ukraine'));
      await first.promise;
    });

    expect(result.current.formatted?.value).toBe('Rynok Square, Lviv, Ukraine');
  });

  it('cancels a queued map geocode when search supplies the result', async () => {
    const picked = location(50.45, 30.52, 'Maidan, Kyiv, Ukraine');
    const { result } = renderHook(() =>
      usePinGeocodeWorkflow({ initialPin: null, libraries }),
    );

    act(() => {
      result.current.handleMapPick({ lat: 50.4, lng: 30.5 }, 16);
      result.current.handlePlacePicked(picked);
    });

    await advanceGeocodeDelay();

    expect(mocks.reverseGeocode).not.toHaveBeenCalled();
    expect(result.current.stage).toBe('resolved');
    expect(result.current.formatted?.value).toBe('Maidan, Kyiv, Ukraine');
  });
});
