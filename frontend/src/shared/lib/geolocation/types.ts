export type GeolocationFailure =
  | 'unsupported'
  | 'denied'
  | 'unavailable'
  | 'timeout';

export type GeolocationPermission =
  | 'granted'
  | 'denied'
  | 'prompt'
  | 'unknown'
  | 'unsupported';

export type Coordinates = { lat: number; lng: number };
