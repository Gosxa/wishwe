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
  fetchSuggestions: vi.fn(async () => []),
  fetchPlaceDetails: vi.fn(),
  createSessionToken: vi.fn(() => ({})),
  track: vi.fn(),
}));

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
  });
};

const dropPin = async () => {
  await act(async () => {
    fake.listeners.get('dragstart')?.forEach(handler => handler());
  });
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

  it('opens with focus on the search input, which is the keyboard path', async () => {
    renderPicker();
    await settle();

    expect(document.activeElement).toBe(
      screen.getByRole('combobox', {
        name: 'Search for a place or an address',
      }),
    );
  });

  it('shows the initial placement instructions only once', async () => {
    renderPicker();
    await settle();

    expect(screen.getAllByText(/(?:click|drag).*(?:spot|map)/i)).toHaveLength(
      1,
    );
  });

  it('keeps confirm disabled until a pin resolves to an address', async () => {
    renderPicker();
    await settle();

    expect(confirmButton().disabled).toBe(true);
    expect(
      screen.getByText('Click a spot or move the map to place the pin'),
    ).toBeTruthy();

    await dropPin();

    expect(confirmButton().disabled).toBe(false);
    expect(
      screen.getByText('Khreshchatyk St, 22, Kyiv, 01001, Ukraine'),
    ).toBeTruthy();
    expect(screen.queryByText(/match:/i)).toBeNull();
  });

  it('does not lose the first drag when Maps settles before React rerenders', async () => {
    renderPicker();
    await settle();

    await act(async () => {
      fake.listeners.get('dragstart')?.forEach(handler => handler());
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
    await settle();

    await dropPin();

    expect(mocks.reverseGeocode).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText('Khreshchatyk St, 22, Kyiv, 01001, Ukraine'),
    ).toBeTruthy();
  });

  it('drops the resolved address the moment the map moves again', async () => {
    renderPicker();
    await settle();
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
    await settle();

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
    await settle();

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
    await settle();

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

    await settle();
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

    await settle();
    await dropPin();

    expect(confirmButton().textContent).toBe('Use these coordinates');
    expect(screen.getByText('No street address here')).toBeTruthy();

    fireEvent.click(confirmButton());
    expect(onConfirm.mock.calls[0][0].formatted).toBe('50.45719, 30.55011');
  });

  it('still offers the pin when the address lookup fails', async () => {
    mocks.reverseGeocode.mockRejectedValue(new Error('geocoder down'));
    renderPicker();

    await settle();
    await dropPin();

    expect(confirmButton().textContent).toBe('Use coordinates anyway');
    expect(screen.getByText('Couldn’t look up this address')).toBeTruthy();
    expect(confirmButton().disabled).toBe(false);
  });

  it('asks before overwriting text the user typed themselves', async () => {
    const { onConfirm } = renderPicker({
      initialValue: 'Bar Nebo, Lviv — the one by the park',
    });

    await settle();
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

    await settle();
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
    await settle();

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
