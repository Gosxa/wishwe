import { track } from '@vercel/analytics';

type LocationPickerEvents = {
  location_picker_opened: {
    mode: 'create' | 'edit';
    source: 'button' | 'change';
  };
  location_picker_search: { query_length: number; result_count: number };
  location_picker_permission: {
    outcome: 'granted' | 'denied' | 'skipped' | 'unsupported' | 'unavailable';
    source: 'auto' | 'prompt' | 'map';
  };
  location_picker_pin_moved: { method: 'drag' | 'search' | 'geolocate' };
  location_picker_confirmed: {
    had_address: boolean;
    was_replacement: boolean;
    zoom: number;
  };
  location_picker_dismissed: { reason: 'cancel' | 'close' | 'discard' };
  location_picker_failed: {
    stage: 'sdk' | 'search' | 'geocode' | 'geolocation';
  };
};

export const trackLocationPicker = <K extends keyof LocationPickerEvents>(
  event: K,
  properties: LocationPickerEvents[K],
): void => {
  track(event, properties);
};
