// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GeolocationError,
  isGeolocationSupported,
  requestCurrentPosition,
  toGeolocationFailure,
} from './requestPosition';

type Success = (position: { coords: GeolocationCoordinates }) => void;
type Failure = (error: { code: number }) => void;

const stubGeolocation = (
  getCurrentPosition: (success: Success, failure: Failure) => void,
) => {
  vi.stubGlobal('navigator', {
    ...navigator,
    geolocation: { getCurrentPosition },
  });
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('requestCurrentPosition', () => {
  it('hands back the coordinates in the shape the map expects', async () => {
    stubGeolocation(success =>
      success({
        coords: {
          latitude: 49.8397,
          longitude: 24.0297,
        } as GeolocationCoordinates,
      }),
    );

    await expect(requestCurrentPosition()).resolves.toEqual({
      lat: 49.8397,
      lng: 24.0297,
    });
  });

  it.each([
    [1, 'denied'],
    [2, 'unavailable'],
    [3, 'timeout'],
    [99, 'unavailable'],
  ])('turns error code %i into "%s"', async (code, reason) => {
    stubGeolocation((_success, failure) => failure({ code }));

    await expect(requestCurrentPosition()).rejects.toMatchObject({ reason });
  });

  it('rejects as unsupported where the browser has no geolocation', async () => {
    vi.stubGlobal('navigator', { ...navigator, geolocation: undefined });

    expect(isGeolocationSupported()).toBe(false);
    await expect(requestCurrentPosition()).rejects.toMatchObject({
      reason: 'unsupported',
    });
  });
});

describe('toGeolocationFailure', () => {
  it('reads the reason off our own error', () => {
    expect(toGeolocationFailure(new GeolocationError('timeout'))).toBe(
      'timeout',
    );
  });

  it('treats anything else as an unavailable position', () => {
    expect(toGeolocationFailure(new Error('boom'))).toBe('unavailable');
  });
});
