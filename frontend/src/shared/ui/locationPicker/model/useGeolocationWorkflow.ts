'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { readGeolocationPermission } from '@/shared/lib/geolocation/permission';
import {
  GEOLOCATION_TIMEOUT_MS,
  requestCurrentPosition,
  toGeolocationFailure,
} from '@/shared/lib/geolocation/requestPosition';
import type { GeolocationFailure } from '@/shared/lib/geolocation/types';
import { trackLocationPicker } from '@/shared/lib/googleMaps/analytics';
import type { LocationPin } from '@/shared/lib/googleMaps/types';
import type { LatLng, PickerStep } from './types';

type LocateSource = 'auto' | 'prompt' | 'map';

type Options = {
  initialPin: LocationPin | null;
  onLocated: (position: LatLng) => void;
};

export const useGeolocationWorkflow = ({ initialPin, onLocated }: Options) => {
  const [step, setStep] = useState<PickerStep>(
    initialPin ? 'map' : 'permission',
  );
  const [isLocating, setIsLocating] = useState(false);
  const [failure, setFailure] = useState<GeolocationFailure | null>(null);
  const locateId = useRef(0);
  const permissionId = useRef(0);

  const locate = useCallback(
    async (source: LocateSource) => {
      const id = ++locateId.current;

      if (source !== 'map') setStep('locating');

      setIsLocating(true);
      setFailure(null);

      try {
        const position = await requestCurrentPosition({
          timeout: GEOLOCATION_TIMEOUT_MS,
        });

        if (id !== locateId.current) return;

        onLocated(position);
        setStep('map');
        trackLocationPicker('location_picker_permission', {
          outcome: 'granted',
          source,
        });
      } catch (error) {
        if (id !== locateId.current) return;

        const nextFailure = toGeolocationFailure(error);

        setFailure(nextFailure);

        if (source !== 'map') setStep('manual');

        trackLocationPicker('location_picker_permission', {
          outcome: nextFailure === 'timeout' ? 'unavailable' : nextFailure,
          source,
        });
        trackLocationPicker('location_picker_failed', {
          stage: 'geolocation',
        });
      } finally {
        if (id === locateId.current) setIsLocating(false);
      }
    },
    [onLocated],
  );

  const locateMe = useCallback(() => void locate('map'), [locate]);

  const allowLocation = useCallback(() => void locate('prompt'), [locate]);

  const enterManually = useCallback(() => {
    locateId.current += 1;
    permissionId.current += 1;
    setIsLocating(false);
    setStep('manual');
    trackLocationPicker('location_picker_permission', {
      outcome: 'skipped',
      source: 'prompt',
    });
  }, []);

  const openMap = useCallback(() => setStep('map'), []);

  useEffect(() => {
    if (initialPin) return;

    const id = ++permissionId.current;

    void readGeolocationPermission().then(permission => {
      if (id !== permissionId.current) return;

      if (permission === 'granted') {
        void locate('auto');

        return;
      }

      if (permission === 'denied' || permission === 'unsupported') {
        setFailure(permission === 'denied' ? 'denied' : 'unsupported');
        setStep('manual');
        trackLocationPicker('location_picker_permission', {
          outcome: permission,
          source: 'auto',
        });
      }
    });

    return () => {
      if (permissionId.current === id) permissionId.current += 1;
    };
  }, [initialPin, locate]);

  useEffect(
    () => () => {
      locateId.current += 1;
    },
    [],
  );

  return {
    step,
    isLocating,
    failure,
    isBlocked: failure === 'denied' || failure === 'unsupported',
    locateMe,
    allowLocation,
    enterManually,
    openMap,
  };
};
