import type { ResolvedPlace } from './types';

export const LOCATION_MAX_LENGTH = 255;

export type AddressParts = {
  name?: string;
  street?: string;
  city?: string;
  country?: string;
};

export type FormattedLocation = {
  value: string;
  wasTrimmed: boolean;
};

export const collapseWhitespace = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

export const trimToLength = (
  value: string,
  max: number = LOCATION_MAX_LENGTH,
): FormattedLocation => {
  if (value.length <= max) return { value, wasTrimmed: false };

  const window = value.slice(0, max + 1);
  const lastBoundary = window.lastIndexOf(' ');

  if (lastBoundary <= 0) {
    return { value: value.slice(0, max), wasTrimmed: true };
  }

  return {
    value: window.slice(0, lastBoundary).replace(/[,\s]+$/, ''),
    wasTrimmed: true,
  };
};

/** "50.45719, 30.55011" — the fallback when the spot has no address at all. */
export const formatCoordinates = (lat: number, lng: number): string =>
  `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

const joinParts = (parts: AddressParts): string => {
  const ordered = [parts.name, parts.street, parts.city, parts.country];
  const seen = new Set<string>();

  return ordered
    .map(part => collapseWhitespace(part ?? ''))
    .filter(part => {
      if (!part) return false;

      const key = part.toLowerCase();

      if (seen.has(key)) return false;

      seen.add(key);

      return true;
    })
    .join(', ');
};

export const formatLocation = (
  place: ResolvedPlace,
  parts: AddressParts = {},
): FormattedLocation => {
  const named = place.name ? joinParts({ ...parts, name: place.name }) : '';
  const plain = collapseWhitespace(place.formattedAddress ?? '');
  const chosen = named || plain || formatCoordinates(place.lat, place.lng);

  return trimToLength(chosen);
};
