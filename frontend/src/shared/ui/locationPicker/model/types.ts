import type { AddressParts } from '@/shared/lib/googleMaps/formatLocation';
import type { ResolvedPlace } from '@/shared/lib/googleMaps/types';

export type LatLng = { lat: number; lng: number };

export type PickerStage =
  | 'loading'
  | 'mapFailed'
  | 'idle'
  | 'resolving'
  | 'resolved'
  | 'noAddress'
  | 'geocodeFailed'
  | 'tooBroad';

export type PinStage = Exclude<PickerStage, 'loading' | 'mapFailed'>;

export type PickerDialog = 'replace' | 'discard' | null;

export type PickerStep = 'permission' | 'locating' | 'manual' | 'map';

export type ResolvedLocation = {
  place: ResolvedPlace;
  parts: AddressParts;
};
