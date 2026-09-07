'use client';

import { useState } from 'react';
import type { LocationPin } from '@/shared/lib/googleMaps/types';
import { LOCATION_FIELD_COPY } from '@/shared/ui/locationPicker/copy';
import type { EventFormModel } from './types';

type Options = {
  initialPlaceId: string | null;
  onValueChange: (value: string) => void;
};

type EventLocation = {
  placeId: string | null;
  onChange: (value: string) => void;
  picker: EventFormModel['locationPicker'];
};

export const useEventLocation = ({
  initialPlaceId,
  onValueChange,
}: Options): EventLocation => {
  const [pin, setPin] = useState<LocationPin | null>(null);
  const [placeId, setPlaceId] = useState(initialPlaceId);
  const [wasPinCleared, setWasPinCleared] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const onChange = (value: string) => {
    onValueChange(value);
    setAnnouncement('');

    if ((pin && value !== pin.formatted) || (!pin && placeId)) {
      setPin(null);
      setPlaceId(null);
      setWasPinCleared(true);
    }
  };

  const apply = (nextPin: LocationPin) => {
    onValueChange(nextPin.formatted);
    setPin(nextPin);
    setPlaceId(nextPin.placeId ?? null);
    setWasPinCleared(false);
    setAnnouncement(LOCATION_FIELD_COPY.announce(nextPin.formatted));
  };

  const clear = () => {
    onValueChange('');
    setPin(null);
    setPlaceId(null);
    setWasPinCleared(false);
    setAnnouncement('');
  };

  return {
    placeId,
    onChange,
    picker: {
      pin,
      status: pin || placeId ? 'pinned' : wasPinCleared ? 'edited' : 'none',
      announcement,
      apply,
      clear,
    },
  };
};
