import { describe, expect, it } from 'vitest';
import {
  collapseWhitespace,
  formatCoordinates,
  formatLocation,
  LOCATION_MAX_LENGTH,
  trimToLength,
} from './formatLocation';

describe('collapseWhitespace', () => {
  it('collapses runs of spaces and strips newlines', () => {
    expect(collapseWhitespace('  Bar   Nebo\n\n Lviv \t')).toBe(
      'Bar Nebo Lviv',
    );
  });
});

describe('formatCoordinates', () => {
  it('writes five decimal places', () => {
    expect(formatCoordinates(50.457192, 30.550113)).toBe('50.45719, 30.55011');
  });

  it('pads coordinates that have fewer decimals', () => {
    expect(formatCoordinates(50, -0.5)).toBe('50.00000, -0.50000');
  });
});

describe('trimToLength', () => {
  it('leaves a short value untouched', () => {
    expect(trimToLength('Kyiv')).toEqual({ value: 'Kyiv', wasTrimmed: false });
  });

  it('cuts on a word boundary, never mid-word', () => {
    const value = `${'a'.repeat(250)} boundary tail`;
    const result = trimToLength(value);

    expect(result.wasTrimmed).toBe(true);
    expect(result.value).toBe('a'.repeat(250));
    expect(value.startsWith(result.value)).toBe(true);
    expect(result.value.endsWith('bound')).toBe(false);
  });

  it('drops the trailing comma left behind by the cut', () => {
    const value = `${'a'.repeat(240)}, ${'b'.repeat(40)}`;

    expect(trimToLength(value).value).toBe('a'.repeat(240));
  });

  it('hard-cuts a single word that has no boundary to break on', () => {
    const value = 'x'.repeat(300);
    const result = trimToLength(value);

    expect(result.value).toHaveLength(LOCATION_MAX_LENGTH);
    expect(result.wasTrimmed).toBe(true);
  });

  it('keeps a value that is exactly at the limit', () => {
    const value = 'y'.repeat(LOCATION_MAX_LENGTH);

    expect(trimToLength(value)).toEqual({ value, wasTrimmed: false });
  });
});

describe('formatLocation', () => {
  it('writes a named place as name, street, city and country', () => {
    const result = formatLocation(
      {
        name: 'Bar Nebo',
        formattedAddress: 'Vulytsia Lysenka, 4, Lviv, Lviv Oblast, Ukraine',
        lat: 49.8397,
        lng: 24.0297,
      },
      { street: 'Vulytsia Lysenka 4', city: 'Lviv', country: 'Ukraine' },
    );

    expect(result.value).toBe('Bar Nebo, Vulytsia Lysenka 4, Lviv, Ukraine');
  });

  it('keeps the country, because guests travelling need it', () => {
    const result = formatLocation(
      { name: 'Bar Nebo', lat: 49.8, lng: 24 },
      { street: 'Vulytsia Lysenka 4', city: 'Lviv', country: 'Ukraine' },
    );

    expect(result.value).toContain('Ukraine');
  });

  it('does not repeat a part that already matches the name', () => {
    const result = formatLocation(
      { name: 'Lviv', lat: 49.8, lng: 24 },
      { city: 'Lviv', country: 'Ukraine' },
    );

    expect(result.value).toBe('Lviv, Ukraine');
  });

  it('falls back to the formatted address when there is no place name', () => {
    const result = formatLocation({
      formattedAddress: 'Khreshchatyk St, 22, Kyiv, 01001, Ukraine',
      lat: 50.44771,
      lng: 30.52258,
    });

    expect(result.value).toBe('Khreshchatyk St, 22, Kyiv, 01001, Ukraine');
  });

  it('falls back to coordinates when the spot has no address at all', () => {
    const result = formatLocation({ lat: 50.457192, lng: 30.550113 });

    expect(result.value).toBe('50.45719, 30.55011');
  });

  it('collapses whitespace inside a formatted address', () => {
    const result = formatLocation({
      formattedAddress: 'Khreshchatyk St,  22,\nKyiv',
      lat: 50,
      lng: 30,
    });

    expect(result.value).toBe('Khreshchatyk St, 22, Kyiv');
  });

  it('reports a trim so the picker can warn about it', () => {
    const result = formatLocation({
      formattedAddress: `${'Long Street Name, '.repeat(30)}Kyiv`,
      lat: 50,
      lng: 30,
    });

    expect(result.wasTrimmed).toBe(true);
    expect(result.value.length).toBeLessThanOrEqual(LOCATION_MAX_LENGTH);
  });
});
