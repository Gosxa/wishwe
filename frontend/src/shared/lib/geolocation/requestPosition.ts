import type { Coordinates, GeolocationFailure } from './types';

export const GEOLOCATION_TIMEOUT_MS = 10_000;
const MAX_POSITION_AGE_MS = 60_000;

const CODE_TO_FAILURE: Record<number, GeolocationFailure> = {
  1: 'denied',
  2: 'unavailable',
  3: 'timeout',
};

export class GeolocationError extends Error {
  readonly reason: GeolocationFailure;

  constructor(reason: GeolocationFailure) {
    super(`Geolocation failed: ${reason}`);
    this.name = 'GeolocationError';
    this.reason = reason;
  }
}

export const isGeolocationSupported = (): boolean =>
  typeof navigator !== 'undefined' && Boolean(navigator.geolocation);

export const requestCurrentPosition = ({
  timeout = GEOLOCATION_TIMEOUT_MS,
}: { timeout?: number } = {}): Promise<Coordinates> =>
  new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new GeolocationError('unsupported'));

      return;
    }

    navigator.geolocation.getCurrentPosition(
      position =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      error =>
        reject(
          new GeolocationError(CODE_TO_FAILURE[error.code] ?? 'unavailable'),
        ),
      {
        timeout,
        enableHighAccuracy: true,
        maximumAge: MAX_POSITION_AGE_MS,
      },
    );
  });

export const toGeolocationFailure = (error: unknown): GeolocationFailure =>
  error instanceof GeolocationError ? error.reason : 'unavailable';
