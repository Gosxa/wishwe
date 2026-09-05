import { describe, expect, it } from 'vitest';
import { buildGoogleMapsUrl } from './buildGoogleMapsUrl';

describe('buildGoogleMapsUrl', () => {
  it('targets the exact Google place while retaining the readable address', () => {
    const url = new URL(
      buildGoogleMapsUrl(
        'Velyka Vasylkivska St, 100, Kyiv',
        'ChIJ-place/id',
      ) as string,
    );

    expect(`${url.origin}${url.pathname}`).toBe(
      'https://www.google.com/maps/search/',
    );
    expect(url.searchParams.get('api')).toBe('1');
    expect(url.searchParams.get('query')).toBe(
      'Velyka Vasylkivska St, 100, Kyiv',
    );
    expect(url.searchParams.get('query_place_id')).toBe('ChIJ-place/id');
  });

  it.each([undefined, null, '', '   '])(
    'returns no link when the place ID is %j',
    placeId => {
      expect(buildGoogleMapsUrl('Typed by hand', placeId)).toBeNull();
    },
  );
});
