// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AddressParts } from '@/shared/lib/googleMaps/formatLocation';
import type { SourcedSuggestion } from '@/shared/lib/googleMaps/placesService';
import type { LocationPin, ResolvedPlace } from '@/shared/lib/googleMaps/types';

type Listener = (...args: unknown[]) => void;

const fake = vi.hoisted(() => ({
  listeners: new Map<string, Listener[]>(),
  center: { lat: 50.44771, lng: 30.52258 },
  projected: { lat: 50.45123, lng: 30.52789 },
  zoom: 16,
}));

const mocks = vi.hoisted(() => ({
  loadGoogleMaps: vi.fn(),
  isMapsConfigured: vi.fn(() => true),
  resetGoogleMapsLoader: vi.fn(),
  hasMapsAuthFailed: vi.fn(() => false),
  onMapsAuthFailure: vi.fn<(listener: () => void) => () => void>(
    () => () => {},
  ),
  reverseGeocode: vi.fn(),
  fetchSuggestions: vi.fn(async (): Promise<SourcedSuggestion[]> => []),
  fetchPlaceDetails: vi.fn(),
  createSessionToken: vi.fn(() => ({})),
  readGeolocationPermission: vi.fn(async () => 'prompt' as const),
  requestCurrentPosition: vi.fn(),
  track: vi.fn(),
}));

vi.mock('@/shared/lib/geolocation/permission', () => ({
  readGeolocationPermission: mocks.readGeolocationPermission,
}));

vi.mock('@/shared/lib/geolocation/requestPosition', async () => {
  const actual = await vi.importActual<
    typeof import('@/shared/lib/geolocation/requestPosition')
  >('@/shared/lib/geolocation/requestPosition');

  return { ...actual, requestCurrentPosition: mocks.requestCurrentPosition };
});

vi.mock('@/shared/lib/googleMaps/loadGoogleMaps', () => ({
  loadGoogleMaps: mocks.loadGoogleMaps,
  isMapsConfigured: mocks.isMapsConfigured,
  resetGoogleMapsLoader: mocks.resetGoogleMapsLoader,
  hasMapsAuthFailed: mocks.hasMapsAuthFailed,
  onMapsAuthFailure: mocks.onMapsAuthFailure,
  MAPS_SLOW_MS: 3000,
  MAPS_TIMEOUT_MS: 8000,
}));

vi.mock('@/shared/lib/googleMaps/placesService', () => ({
  reverseGeocode: mocks.reverseGeocode,
  fetchSuggestions: mocks.fetchSuggestions,
  fetchPlaceDetails: mocks.fetchPlaceDetails,
  createSessionToken: mocks.createSessionToken,
}));

vi.mock('@vercel/analytics', () => ({ track: mocks.track }));

import { GeolocationError } from '@/shared/lib/geolocation/requestPosition';
import { LocationPickerModal } from './LocationPickerModal';

class FakeMap {
  constructor() {
    fake.listeners.clear();
  }

  addListener(event: string, handler: Listener) {
    fake.listeners.set(event, [...(fake.listeners.get(event) ?? []), handler]);

    return { remove: () => fake.listeners.delete(event) };
  }

  getCenter() {
    return { lat: () => fake.center.lat, lng: () => fake.center.lng };
  }

  getZoom() {
    return fake.zoom;
  }

  getBounds() {
    return null;
  }

  getProjection() {
    return {
      fromLatLngToPoint: () => ({ x: 128, y: 128 }),
      fromPointToLatLng: () => ({
        lat: () => fake.projected.lat,
        lng: () => fake.projected.lng,
        toJSON: () => fake.projected,
      }),
    };
  }

  panTo(next: { lat: number; lng: number }) {
    fake.center = next;
  }

  setZoom(next: number) {
    fake.zoom = next;
  }
}

class FakePoint {
  constructor(
    public x: number,
    public y: number,
  ) {}
}

const libraries = {
  maps: { Map: FakeMap },
  places: {},
  geocoding: {},
  core: { Point: FakePoint },
};

const KYIV: ResolvedPlace = {
  formattedAddress: 'Khreshchatyk St, 22, Kyiv, 01001, Ukraine',
  lat: 50.44771,
  lng: 30.52258,
};

const resolvedTo = (place: ResolvedPlace, parts: AddressParts = {}) =>
  mocks.reverseGeocode.mockResolvedValue({ place, parts });

const renderPicker = (
  props: Partial<Parameters<typeof LocationPickerModal>[0]> = {},
) => {
  const onConfirm = vi.fn<(pin: LocationPin) => void>();
  const onClose = vi.fn();

  const view = render(
    <LocationPickerModal
      mode="create"
      source="button"
      initialValue=""
      initialPin={null}
      onConfirm={onConfirm}
      onClose={onClose}
      {...props}
    />,
  );

  return { ...view, onConfirm, onClose };
};

const settle = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
};

const pickPlace = async (
  place: ResolvedPlace = {
    lat: 50.44001,
    lng: 30.52001,
    formattedAddress: 'Khreshchatyk St, 20, Kyiv, 01001, Ukraine',
  },
) => {
  mocks.fetchSuggestions.mockResolvedValueOnce([
    {
      placeId: place.placeId ?? 'place-1',
      primary: place.name ?? 'Khreshchatyk St, 20',
      secondary: 'Kyiv, Ukraine',
      prediction: {} as google.maps.places.PlacePrediction,
    },
  ]);
  mocks.fetchPlaceDetails.mockResolvedValueOnce({
    place: {
      lat: place.lat ?? 50.44001,
      lng: place.lng ?? 30.52001,
      formattedAddress:
        place.formattedAddress ?? 'Khreshchatyk St, 20, Kyiv, 01001, Ukraine',
      placeId: place.placeId,
      name: place.name,
    },
    parts: {},
  });

  const searchInput = screen.getByRole('combobox', {
    name: 'Search for a place or an address',
  });

  fireEvent.change(searchInput, { target: { value: 'Khreshchatyk' } });

  await act(async () => {
    vi.advanceTimersByTime(350);
    await Promise.resolve();
  });

  const option = screen.getByRole('option');

  await act(async () => {
    fireEvent.click(option);
    await Promise.resolve();
  });
  await settle();
};

const skipToMap = async () => {
  await settle();

  const skip = screen.queryByRole('button', { name: 'I’ll type the address' });

  if (skip) fireEvent.click(skip);

  await pickPlace();
};

const dropPin = async (next?: { lat: number; lng: number }) => {
  await act(async () => {
    fake.listeners.get('dragstart')?.forEach(handler => handler());
  });
  fake.center =
    next ??
    (fake.center.lat === 50.44001
      ? { lat: 50.44771, lng: 30.52258 }
      : fake.center);
  await act(async () => {
    fake.listeners.get('idle')?.forEach(handler => handler());
  });
  await act(async () => {
    vi.advanceTimersByTime(400);
    await Promise.resolve();
  });
};

const confirmButton = () =>
  screen
    .getAllByRole('button')
    .find(button =>
      /Use th|Use coordinates|Update the location/.test(
        button.textContent ?? '',
      ),
    ) as HTMLButtonElement;

describe('LocationPickerModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fake.listeners.clear();
    fake.center = { lat: 50.44771, lng: 30.52258 };
    fake.projected = { lat: 50.45123, lng: 30.52789 };
    fake.zoom = 16;
    mocks.isMapsConfigured.mockReturnValue(true);
    mocks.hasMapsAuthFailed.mockReturnValue(false);
    mocks.onMapsAuthFailure.mockImplementation(() => () => {});
    mocks.loadGoogleMaps.mockResolvedValue(libraries);
    mocks.readGeolocationPermission.mockResolvedValue('prompt');
    mocks.requestCurrentPosition.mockRejectedValue(
      new GeolocationError('denied'),
    );
    resolvedTo(KYIV);
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false })),
    );
    HTMLElement.prototype.animate = vi.fn(
      () => ({ cancel: vi.fn() }) as unknown as Animation,
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('opens by asking for a location, with the offer holding focus', async () => {
    renderPicker();
    await settle();

    expect(screen.getByText('Start from where you are?')).toBeTruthy();
    expect(screen.queryByTestId('location-picker-map-canvas')).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Use my location' }),
    );
    expect(mocks.requestCurrentPosition).not.toHaveBeenCalled();
  });

  it('opens the map on the reported position once sharing is allowed', async () => {
    const home = { lat: 49.8397, lng: 24.0297 };

    mocks.requestCurrentPosition.mockResolvedValue(home);
    resolvedTo({ ...home, formattedAddress: 'Rynok Square, Lviv, Ukraine' });
    renderPicker();
    await settle();

    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));
    await settle();

    expect(screen.getByTestId('location-picker-map-canvas')).toBeTruthy();
    expect(fake.center).toEqual(home);
    expect(screen.getByTestId('location-picker-pin').className).toContain(
      'pinSolid',
    );

    await act(async () => {
      fake.listeners.get('idle')?.forEach(handler => handler());
    });
    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve();
    });

    expect(mocks.reverseGeocode).toHaveBeenCalledWith({
      geocoding: libraries.geocoding,
      ...home,
    });
    expect(screen.getByText('Rynok Square, Lviv, Ukraine')).toBeTruthy();
    expect(confirmButton().disabled).toBe(false);
  });

  it('hands a refusal to the autocomplete instead of opening the map', async () => {
    mocks.requestCurrentPosition.mockRejectedValue(
      new GeolocationError('denied'),
    );
    renderPicker();
    await settle();

    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));
    await settle();

    expect(screen.getByText('Type the address above')).toBeTruthy();
    expect(
      screen.getByText('Location sharing is off, so let’s do this by hand.'),
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Or browse the map' }),
    ).toBeNull();
    expect(screen.queryByTestId('location-picker-map-canvas')).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole('combobox', {
        name: 'Search for a place or an address',
      }),
    );
  });

  it('skips the ask entirely when the browser already blocked us', async () => {
    mocks.readGeolocationPermission.mockResolvedValue(
      'denied' as unknown as 'prompt',
    );
    renderPicker();
    await settle();

    expect(screen.queryByText('Start from where you are?')).toBeNull();
    expect(screen.getByText('Type the address above')).toBeTruthy();
    expect(mocks.requestCurrentPosition).not.toHaveBeenCalled();
  });

  it('locates without asking twice when permission is already granted', async () => {
    const home = { lat: 49.8397, lng: 24.0297 };

    mocks.readGeolocationPermission.mockResolvedValue(
      'granted' as unknown as 'prompt',
    );
    mocks.requestCurrentPosition.mockResolvedValue(home);
    renderPicker();
    await settle();

    expect(screen.queryByText('Start from where you are?')).toBeNull();
    expect(screen.getByTestId('location-picker-map-canvas')).toBeTruthy();
    expect(fake.center).toEqual(home);
  });

  it('never asks when reopened on a pin that is already placed', async () => {
    renderPicker({
      initialPin: { lat: 50.44771, lng: 30.52258, formatted: 'Khreshchatyk' },
    });
    await settle();

    expect(screen.queryByText('Start from where you are?')).toBeNull();
    expect(mocks.readGeolocationPermission).not.toHaveBeenCalled();
    expect(screen.getByTestId('location-picker-map-canvas')).toBeTruthy();
  });

  it('stays on the typing screen when a position lands after the user gave up', async () => {
    let arrive: (position: { lat: number; lng: number }) => void = () => {};

    mocks.requestCurrentPosition.mockReturnValue(
      new Promise(resolve => {
        arrive = resolve;
      }),
    );
    renderPicker();
    await settle();

    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));
    await settle();

    expect(screen.getByText('Finding your position…')).toBeTruthy();
    expect(screen.getByTestId('location-picker-pin-pulse')).toBeTruthy();
    expect(screen.queryByRole('status', { name: 'Loading' })).toBeNull();

    fireEvent.click(
      screen.getByRole('button', { name: 'Type the address instead' }),
    );
    expect(screen.getByText('Type the address above')).toBeTruthy();

    await act(async () => {
      arrive({ lat: 49.8397, lng: 24.0297 });
      await Promise.resolve();
    });
    await settle();

    expect(screen.getByText('Type the address above')).toBeTruthy();
    expect(screen.queryByTestId('location-picker-map-canvas')).toBeNull();
  });

  it('keeps the locate button live after a failure that is not a refusal', async () => {
    mocks.requestCurrentPosition.mockRejectedValue(
      new GeolocationError('timeout'),
    );
    renderPicker();
    await settle();

    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));
    await settle();

    expect(
      screen.getByText('Finding you took too long, so let’s do this by hand.'),
    ).toBeTruthy();

    await pickPlace();

    const locate = screen.getByRole('button', {
      name: 'We couldn’t read your position — try again',
    });

    expect(locate.hasAttribute('disabled')).toBe(false);
  });

  it('disables the locate button once the browser has refused outright', async () => {
    renderPicker();
    await settle();

    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));
    await settle();

    await pickPlace();

    const locate = screen.getByRole('button', {
      name: 'Location access is blocked in your browser',
    });

    expect(locate.hasAttribute('disabled')).toBe(true);
  });

  it('does not offer browsing the map when declined, opening the map only after selecting an address', async () => {
    renderPicker();
    await settle();

    fireEvent.click(
      screen.getByRole('button', { name: 'I’ll type the address' }),
    );
    expect(screen.getByText('Type the address above')).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Or browse the map' }),
    ).toBeNull();
    expect(screen.queryByTestId('location-picker-map-canvas')).toBeNull();

    await pickPlace();

    expect(screen.getByTestId('location-picker-map-canvas')).toBeTruthy();
    expect(screen.getByTestId('location-picker-pin').className).toContain(
      'pinSolid',
    );
  });

  it('shows the initial placement instructions only once', async () => {
    renderPicker();
    await skipToMap();

    expect(screen.getByText('Move the map to fine-tune the pin')).toBeTruthy();
  });

  it('keeps confirm disabled on the manual screen until an address is selected', async () => {
    renderPicker();
    await settle();

    fireEvent.click(
      screen.getByRole('button', { name: 'I’ll type the address' }),
    );
    expect(confirmButton().disabled).toBe(true);
    expect(screen.getByText('No place picked yet')).toBeTruthy();

    await pickPlace();

    expect(confirmButton().disabled).toBe(false);
    expect(
      screen.getByText('Khreshchatyk St, 20, Kyiv, 01001, Ukraine'),
    ).toBeTruthy();
    expect(screen.queryByText(/match:/i)).toBeNull();
  });

  it('does not lose the first drag when Maps settles before React rerenders', async () => {
    renderPicker();
    await skipToMap();

    await act(async () => {
      fake.listeners.get('dragstart')?.forEach(handler => handler());
      fake.center = { lat: 50.44771, lng: 30.52258 };
      fake.listeners.get('idle')?.forEach(handler => handler());
    });
    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve();
    });

    expect(mocks.reverseGeocode).toHaveBeenCalledTimes(1);
    expect(confirmButton().disabled).toBe(false);
  });

  it('still reacts to drags after a StrictMode remount', async () => {
    render(
      <StrictMode>
        <LocationPickerModal
          mode="create"
          source="button"
          initialValue=""
          initialPin={null}
          onConfirm={vi.fn()}
          onClose={vi.fn()}
        />
      </StrictMode>,
    );
    await skipToMap();

    await dropPin();

    expect(mocks.reverseGeocode).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText('Khreshchatyk St, 22, Kyiv, 01001, Ukraine'),
    ).toBeTruthy();
  });

  it('drops the resolved address the moment the map moves again', async () => {
    renderPicker();
    await skipToMap();
    await dropPin();

    await act(async () => {
      fake.listeners.get('dragstart')?.forEach(handler => handler());
    });

    expect(
      screen.queryByText('Khreshchatyk St, 22, Kyiv, 01001, Ukraine'),
    ).toBeNull();
    expect(screen.getByText('Finding the address…')).toBeTruthy();
    expect(confirmButton().disabled).toBe(true);

    fake.center = { lat: 50.4, lng: 30.5 };
    resolvedTo({
      formattedAddress: 'Velyka Vasylkivska St, 100, Kyiv, Ukraine',
      lat: 50.4,
      lng: 30.5,
    });

    await act(async () => {
      fake.listeners.get('idle')?.forEach(handler => handler());
    });
    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve();
    });

    expect(
      screen.getByText('Velyka Vasylkivska St, 100, Kyiv, Ukraine'),
    ).toBeTruthy();
  });

  it('keeps the dragged point when the zoom buttons are used next', async () => {
    renderPicker();
    await skipToMap();

    fake.center = { lat: 50.4, lng: 30.5 };
    await dropPin();

    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    await act(async () => {
      fake.listeners.get('idle')?.forEach(handler => handler());
    });

    expect(fake.center).toEqual({ lat: 50.4, lng: 30.5 });
    expect(fake.zoom).toBe(17);
  });

  it('uses the map surface gesture when Google omits dragstart', async () => {
    renderPicker();
    await skipToMap();

    fireEvent.pointerDown(screen.getByTestId('location-picker-map-canvas'));
    await act(async () => {
      fake.listeners.get('idle')?.forEach(handler => handler());
    });
    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve();
    });

    expect(screen.getByTestId('location-picker-pin').className).toContain(
      'pinSolid',
    );
    expect(confirmButton().disabled).toBe(false);
  });

  it('lets a click place the pin on the chosen map point', async () => {
    const clicked = { lat: 50.45123, lng: 30.52789 };

    resolvedTo({
      ...KYIV,
      ...clicked,
      formattedAddress: 'Maidan Nezalezhnosti, Kyiv, Ukraine',
    });
    renderPicker();
    await skipToMap();

    const mapCanvas = screen.getByTestId('location-picker-map-canvas');

    vi.spyOn(mapCanvas, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      right: 400,
      bottom: 300,
      left: 0,
      width: 400,
      height: 300,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(mapCanvas, { clientX: 300, clientY: 150 });
    fireEvent.pointerUp(mapCanvas, { clientX: 300, clientY: 150 });
    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve();
    });

    expect(fake.center).toEqual(clicked);
    expect(mocks.reverseGeocode).toHaveBeenCalledWith({
      geocoding: libraries.geocoding,
      ...clicked,
    });
    expect(
      screen.getByText('Maidan Nezalezhnosti, Kyiv, Ukraine'),
    ).toBeTruthy();
  });

  it('writes the resolved address back to the form on confirm', async () => {
    const { onConfirm } = renderPicker();

    await skipToMap();
    await dropPin();
    fireEvent.click(confirmButton());

    expect(onConfirm).toHaveBeenCalledWith({
      lat: 50.44771,
      lng: 30.52258,
      formatted: 'Khreshchatyk St, 22, Kyiv, 01001, Ukraine',
      placeId: undefined,
    });
  });

  it('offers the coordinates when the spot has no street address', async () => {
    resolvedTo({
      lat: 50.45719,
      lng: 30.55011,
      nearestPlace: 'Trukhaniv Island, Dniprovskyi District, Kyiv',
    });

    const { onConfirm } = renderPicker();

    await skipToMap();
    await dropPin();

    expect(confirmButton().textContent).toBe('Use these coordinates');
    expect(screen.getByText('No street address here')).toBeTruthy();

    fireEvent.click(confirmButton());
    expect(onConfirm.mock.calls[0][0].formatted).toBe('50.45719, 30.55011');
  });

  it('still offers the pin when the address lookup fails', async () => {
    mocks.reverseGeocode.mockRejectedValue(new Error('geocoder down'));
    renderPicker();

    await skipToMap();
    await dropPin();

    expect(confirmButton().textContent).toBe('Use coordinates anyway');
    expect(screen.getByText('Couldn’t look up this address')).toBeTruthy();
    expect(confirmButton().disabled).toBe(false);
  });

  it('asks before overwriting text the user typed themselves', async () => {
    const { onConfirm } = renderPicker({
      initialValue: 'Bar Nebo, Lviv — the one by the park',
    });

    await skipToMap();
    await dropPin();
    fireEvent.click(confirmButton());

    expect(screen.getByText('Replace what you typed?')).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Keep mine' }));
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(confirmButton());
    fireEvent.click(screen.getByRole('button', { name: 'Replace it' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('guards an unconfirmed pin behind the discard dialog on close', async () => {
    const { onClose } = renderPicker();

    await skipToMap();
    await dropPin();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.getByText('Discard this pin?')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Keep picking' }));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('pulses the confirm dialog on backdrop click and closes on Escape', async () => {
    const { onClose } = renderPicker();

    await skipToMap();
    await dropPin();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    const confirmDialog = screen.getByRole('alertdialog');
    const confirmOverlay = confirmDialog.parentElement as HTMLElement;

    expect(confirmOverlay.getAttribute('data-modal-state')).toBe('open');

    fireEvent.click(confirmOverlay);
    expect(onClose).not.toHaveBeenCalled();
    expect(confirmDialog.animate).toHaveBeenCalled();

    fireEvent.keyDown(confirmDialog, { key: 'Escape' });
    expect(screen.queryByText('Discard this pin?')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes losslessly when nothing was picked', async () => {
    const { onClose, onConfirm } = renderPicker();

    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('pulses on a backdrop click instead of closing, like every other modal', async () => {
    const { onClose } = renderPicker();

    await settle();

    const dialog = screen.getByRole('dialog');
    const overlay = dialog.parentElement as HTMLElement;

    fireEvent.click(overlay);

    expect(onClose).not.toHaveBeenCalled();
    expect(dialog.animate).toHaveBeenCalled();
  });

  it('locks body scrolling while open and restores it on close', async () => {
    document.body.style.position = 'relative';

    const { unmount } = renderPicker();

    await settle();
    expect(document.body.style.position).toBe('fixed');

    unmount();
    expect(document.body.style.position).toBe('relative');
  });

  it('names the manual path when the map cannot load', async () => {
    mocks.loadGoogleMaps.mockRejectedValue(new Error('offline'));

    const { onClose } = renderPicker();

    await settle();

    expect(screen.getByText('We couldn’t load the map')).toBeTruthy();
    expect(confirmButton().disabled).toBe(true);
    expect(screen.getByRole('button', { name: /Try again/ })).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'Type the address instead' }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('falls back to the same panel when no API key is configured', async () => {
    mocks.isMapsConfigured.mockReturnValue(false);
    renderPicker();
    await settle();

    expect(screen.getByText('We couldn’t load the map')).toBeTruthy();
    expect(mocks.loadGoogleMaps).not.toHaveBeenCalled();
  });

  it('shows its own fallback when Google rejects the key after the map mounts', async () => {
    let notify = () => {};

    mocks.onMapsAuthFailure.mockImplementation((listener: () => void) => {
      notify = listener;

      return () => {};
    });

    renderPicker();
    await settle();

    expect(screen.queryByText('We couldn’t load the map')).toBeNull();

    await act(async () => {
      notify();
    });

    expect(screen.getByText('We couldn’t load the map')).toBeTruthy();
    expect(confirmButton().disabled).toBe(true);
  });

  it('refuses an address too broad to be useful', async () => {
    renderPicker();
    await skipToMap();

    await act(async () => {
      fake.listeners.get('dragstart')?.forEach(handler => handler());
    });

    fake.zoom = 8;

    await act(async () => {
      fake.listeners.get('idle')?.forEach(handler => handler());
    });

    expect(confirmButton().disabled).toBe(true);
    expect(screen.getByText(/too broad to be useful/)).toBeTruthy();
  });

  it('relabels the confirm button when reopened from "Change"', async () => {
    renderPicker({
      source: 'change',
      initialValue: 'Khreshchatyk St, 22',
      initialPin: {
        lat: 50.44771,
        lng: 30.52258,
        formatted: 'Khreshchatyk St, 22',
      },
    });

    await settle();
    await act(async () => {
      fake.listeners.get('idle')?.forEach(handler => handler());
    });
    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve();
    });

    expect(screen.getByText('Change the location')).toBeTruthy();
    expect(confirmButton().textContent).toBe('Update the location');
  });
});
