// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { LOCATION_FIELD_COPY } from '@/shared/ui/locationPicker/copy';
import { useEventLocation } from './useEventLocation';

const pin = {
  lat: 50.45,
  lng: 30.52,
  formatted: 'Khreshchatyk St, Kyiv',
  placeId: 'ChIJ123',
};

describe('useEventLocation', () => {
  afterEach(cleanup);

  const renderLocation = (initialPlaceId: string | null = null) =>
    renderHook(() => {
      const [value, setValue] = useState('Kyiv');
      const location = useEventLocation({
        initialPlaceId,
        onValueChange: setValue,
      });

      return { value, ...location };
    });

  it('preserves an existing Place ID until its text is edited', () => {
    const { result } = renderLocation('ChIJ-existing');

    expect(result.current.picker.status).toBe('pinned');
    expect(result.current.placeId).toBe('ChIJ-existing');

    act(() => result.current.onChange('Kyiv, near the park'));

    expect(result.current.value).toBe('Kyiv, near the park');
    expect(result.current.placeId).toBeNull();
    expect(result.current.picker.status).toBe('edited');
  });

  it('keeps text, pin, Place ID, and announcement in sync', () => {
    const { result } = renderLocation();

    act(() => result.current.picker.apply(pin));

    expect(result.current.value).toBe(pin.formatted);
    expect(result.current.placeId).toBe(pin.placeId);
    expect(result.current.picker.pin).toEqual(pin);
    expect(result.current.picker.status).toBe('pinned');
    expect(result.current.picker.announcement).toBe(
      LOCATION_FIELD_COPY.announce(pin.formatted),
    );

    act(() => result.current.onChange(pin.formatted));

    expect(result.current.placeId).toBe(pin.placeId);
    expect(result.current.picker.status).toBe('pinned');
    expect(result.current.picker.announcement).toBe('');
  });

  it('clears all location resources together', () => {
    const { result } = renderLocation();

    act(() => result.current.picker.apply(pin));
    act(() => result.current.picker.clear());

    expect(result.current.value).toBe('');
    expect(result.current.placeId).toBeNull();
    expect(result.current.picker.pin).toBeNull();
    expect(result.current.picker.status).toBe('none');
    expect(result.current.picker.announcement).toBe('');
  });
});
