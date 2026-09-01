// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LocationPin } from '@/shared/lib/googleMaps/types';
import type { EventFormModel } from '../model/types';

const mapsMocks = vi.hoisted(() => ({ isConfigured: vi.fn(() => true) }));

vi.mock('@/shared/lib/googleMaps/loadGoogleMaps', () => ({
  GOOGLE_MAPS_ENABLED: true,
  isMapsConfigured: mapsMocks.isConfigured,
}));

vi.mock('@shared/ui/locationPicker/LocationPickerModal', () => ({
  LocationPickerModal: ({
    source,
    initialValue,
    onConfirm,
    onClose,
  }: {
    source: string;
    initialValue: string;
    onConfirm: (pin: LocationPin) => void;
    onClose: () => void;
  }) => (
    <div data-testid="picker" data-source={source} data-initial={initialValue}>
      <button
        type="button"
        onClick={() =>
          onConfirm({ lat: 50.4, lng: 30.5, formatted: 'Khreshchatyk St, 22' })
        }
      >
        confirm
      </button>
      <button type="button" onClick={onClose}>
        dismiss
      </button>
    </div>
  ),
}));

import { LocationField } from './LocationField';

const PIN: LocationPin = {
  lat: 50.4,
  lng: 30.5,
  formatted: 'Khreshchatyk St, 22',
};

type Picker = EventFormModel['locationPicker'];

const renderField = ({
  value = '',
  picker = {},
}: {
  value?: string;
  picker?: Partial<Picker>;
} = {}) => {
  const onChange = vi.fn();
  const apply = vi.fn();
  const clear = vi.fn();

  const view = render(
    <LocationField
      mode="create"
      placeholder="Add a place or an address"
      input={{ value, onChange }}
      picker={{
        pin: null,
        status: 'none',
        announcement: '',
        apply,
        clear,
        ...picker,
      }}
    />,
  );

  return { ...view, onChange, apply, clear };
};

describe('LocationField', () => {
  beforeEach(() => {
    mapsMocks.isConfigured.mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('keeps the id and label the form and e2e suite rely on', () => {
    renderField();

    const input = screen.getByLabelText(/Where\?/) as HTMLInputElement;

    expect(input.id).toBe('eventLocation');
  });

  it('shows no chip when the value was typed by hand', () => {
    renderField({ value: 'Bar Nebo, Lviv — the one by the park' });

    expect(screen.queryByText('Pinned on the map')).toBeNull();
    expect(screen.queryByText('Edited by hand — pin cleared')).toBeNull();
  });

  it('opens the picker from the button and applies the confirmed pin', () => {
    const { apply } = renderField();

    fireEvent.click(screen.getByRole('button', { name: 'Pick on map' }));
    expect(screen.getByTestId('picker').dataset.source).toBe('button');

    fireEvent.click(screen.getByRole('button', { name: 'confirm' }));
    expect(apply).toHaveBeenCalledWith(PIN);
    expect(screen.queryByTestId('picker')).toBeNull();
  });

  it('shows the pinned chip and reopens the picker from "Change"', () => {
    renderField({
      value: PIN.formatted,
      picker: { pin: PIN, status: 'pinned' },
    });

    expect(screen.getByText('Pinned on the map')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    expect(screen.getByTestId('picker').dataset.source).toBe('change');
  });

  it('empties the field through "Clear"', () => {
    const { clear } = renderField({
      value: PIN.formatted,
      picker: { pin: PIN, status: 'pinned' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('says the pin was dropped once the text is edited by hand', () => {
    renderField({
      value: 'Khreshchatyk St, 22 (meet at the fountain)',
      picker: { pin: null, status: 'edited' },
    });

    expect(screen.getByText('Edited by hand — pin cleared')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Pick again' })).toBeTruthy();
  });

  it('passes the current field value to the picker so it can warn about a replacement', () => {
    renderField({ value: 'Somewhere downtown' });

    fireEvent.click(screen.getByRole('button', { name: 'Pick on map' }));
    expect(screen.getByTestId('picker').dataset.initial).toBe(
      'Somewhere downtown',
    );
  });

  it('never intercepts typing', () => {
    const { onChange } = renderField();

    fireEvent.change(screen.getByLabelText(/Where\?/), {
      target: { value: 'Bar Nebo, L' },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('hides all map controls and explains why when there is no API key', () => {
    mapsMocks.isConfigured.mockReturnValue(false);
    renderField({
      value: PIN.formatted,
      picker: { pin: PIN, status: 'pinned' },
    });

    expect(screen.queryByRole('button', { name: 'Pick on map' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Change' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    expect(screen.queryByText('Pinned on the map')).toBeNull();
    expect(
      screen.getByText(
        'Map picking is unavailable right now — type the address instead.',
      ),
    ).toBeTruthy();
    // Typing is untouched, so the form is never blocked.
    expect(screen.getByLabelText(/Where\?/)).toBeTruthy();
  });

  it('announces the confirmed value once, politely', () => {
    renderField({
      value: PIN.formatted,
      picker: {
        pin: PIN,
        status: 'pinned',
        announcement: 'Location set to Khreshchatyk St, 22',
      },
    });

    const region = screen.getByRole('status');

    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.textContent).toBe('Location set to Khreshchatyk St, 22');
  });
});
