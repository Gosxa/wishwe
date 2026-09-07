'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { trackLocationPicker } from '@/shared/lib/googleMaps/analytics';
import {
  hasMapsAuthFailed,
  isMapsConfigured,
  loadGoogleMaps,
  MAPS_SLOW_MS,
  onMapsAuthFailure,
  resetGoogleMapsLoader,
  type MapsLibraries,
} from '@/shared/lib/googleMaps/loadGoogleMaps';

type MapsLoadStatus = 'loading' | 'loaded' | 'failed';

const getInitialStatus = (): MapsLoadStatus =>
  isMapsConfigured() && !hasMapsAuthFailed() ? 'loading' : 'failed';

export const useGoogleMapsLoader = () => {
  const [libraries, setLibraries] = useState<MapsLibraries | null>(null);
  const [status, setStatus] = useState<MapsLoadStatus>(getInitialStatus);
  const [isSlow, setIsSlow] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const requestId = useRef(0);

  useEffect(
    () =>
      onMapsAuthFailure(() => {
        requestId.current += 1;
        setStatus('failed');
        setIsSlow(false);
        trackLocationPicker('location_picker_failed', { stage: 'sdk' });
      }),
    [],
  );

  useEffect(() => {
    if (!isMapsConfigured() || hasMapsAuthFailed()) return;

    const id = ++requestId.current;
    let isActive = true;

    const slowTimer = setTimeout(() => {
      if (isActive && id === requestId.current) setIsSlow(true);
    }, MAPS_SLOW_MS);

    loadGoogleMaps()
      .then(loaded => {
        if (!isActive || id !== requestId.current || hasMapsAuthFailed()) {
          return;
        }

        setLibraries(loaded);
        setStatus('loaded');
      })
      .catch(() => {
        if (!isActive || id !== requestId.current) return;

        setStatus('failed');
        trackLocationPicker('location_picker_failed', { stage: 'sdk' });
      })
      .finally(() => {
        clearTimeout(slowTimer);

        if (isActive && id === requestId.current) setIsSlow(false);
      });

    return () => {
      isActive = false;
      clearTimeout(slowTimer);
    };
  }, [loadAttempt]);

  const retryLoad = useCallback(() => {
    requestId.current += 1;
    resetGoogleMapsLoader();
    setIsSlow(false);

    if (!isMapsConfigured()) {
      setStatus('failed');

      return;
    }

    setStatus('loading');
    setLoadAttempt(attempt => attempt + 1);
  }, []);

  return { libraries, status, isSlow, retryLoad };
};
