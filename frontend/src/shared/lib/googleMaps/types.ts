export type LocationPin = {
  lat: number;
  lng: number;
  formatted: string;
  placeId?: string;
};

export type MapsStatus = 'idle' | 'loading' | 'ready' | 'slow' | 'unavailable';

export type ResolvedPlace = {
  name?: string;
  formattedAddress?: string;
  lat: number;
  lng: number;
  placeId?: string;
  nearestPlace?: string;
};

export type Suggestion = {
  placeId: string;
  primary: string;
  secondary: string;
};
