'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { trackLocationPicker } from '@/shared/lib/googleMaps/analytics';
import {
  formatLocation,
  LOCATION_MAX_LENGTH,
  type AddressParts,
  type FormattedLocation,
} from '@/shared/lib/googleMaps/formatLocation';
import {
  hasMapsAuthFailed,
  loadGoogleMaps,
  onMapsAuthFailure,
  resetGoogleMapsLoader,
  isMapsConfigured,
  MAPS_SLOW_MS,
  type MapsLibraries,
} from '@/shared/lib/googleMaps/loadGoogleMaps';
import { reverseGeocode } from '@/shared/lib/googleMaps/placesService';
import type { LocationPin, ResolvedPlace } from '@/shared/lib/googleMaps/types';
import { LOCATION_PICKER_COPY as COPY } from '../copy';

export const MIN_STREET_ZOOM = 15;
const GEOCODE_IDLE_MS = 400;
const GEOLOCATION_TIMEOUT_MS = 10_000;
/** Kyiv — where the map opens when we know nothing else about the user. */
const FALLBACK_CENTER = { lat: 50.4501, lng: 30.5234 };
const DEFAULT_ZOOM = 16;

export type PickerStage =
  | 'loading'
  | 'mapFailed'
  | 'idle'
  | 'resolving'
  | 'resolved'
  | 'noAddress'
  | 'geocodeFailed'
  | 'tooBroad';

export type PickerDialog = 'replace' | 'discard' | null;

type Resolved = { place: ResolvedPlace; parts: AddressParts };

type Options = {
  mode: 'create' | 'edit';
  source: 'button' | 'change';
  initialValue: string;
  initialPin: LocationPin | null;
  onConfirm: (pin: LocationPin) => void;
  onClose: () => void;
};

export const useLocationPicker = ({
  mode,
  source,
  initialValue,
  initialPin,
  onConfirm,
  onClose,
}: Options) => {
  const [libraries, setLibraries] = useState<MapsLibraries | null>(null);
  const [isSlow, setIsSlow] = useState(false);
  const [stage, setStage] = useState<PickerStage>(
    isMapsConfigured() && !hasMapsAuthFailed() ? 'loading' : 'mapFailed',
  );
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [dialog, setDialog] = useState<PickerDialog>(null);
  const [isSearchListOpen, setIsSearchListOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeolocationBlocked, setIsGeolocationBlocked] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [hasPin, setHasPin] = useState(Boolean(initialPin));
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [center, setCenter] = useState(
    initialPin ? { lat: initialPin.lat, lng: initialPin.lng } : FALLBACK_CENTER,
  );

  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastGeocoded = useRef<string | null>(null);
  const requestId = useRef(0);
  const hasConfirmed = useRef(false);
  const hasPinRef = useRef(Boolean(initialPin));

  useEffect(() => {
    trackLocationPicker('location_picker_opened', { mode, source });
  }, [mode, source]);

  useEffect(
    () =>
      onMapsAuthFailure(() => {
        setStage('mapFailed');
        trackLocationPicker('location_picker_failed', { stage: 'sdk' });
      }),
    [],
  );

  useEffect(() => {
    if (!isMapsConfigured() || hasMapsAuthFailed()) return;

    let isActive = true;

    const slowTimer = setTimeout(() => {
      if (isActive) setIsSlow(true);
    }, MAPS_SLOW_MS);

    loadGoogleMaps()
      .then(loaded => {
        if (!isActive) return;

        setLibraries(loaded);
        setStage(initialPin ? 'resolving' : 'idle');
      })
      .catch(() => {
        if (!isActive) return;

        setStage('mapFailed');
        trackLocationPicker('location_picker_failed', { stage: 'sdk' });
      })
      .finally(() => clearTimeout(slowTimer));

    return () => {
      isActive = false;
      clearTimeout(slowTimer);
    };
  }, [initialPin, loadAttempt]);

  useEffect(
    () => () => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    },
    [],
  );

  const retryLoad = useCallback(() => {
    resetGoogleMapsLoader();
    setStage('loading');
    setIsSlow(false);
    setLoadAttempt(attempt => attempt + 1);
  }, []);

  const runGeocode = useCallback(
    async (lat: number, lng: number) => {
      if (!libraries) return;

      const id = ++requestId.current;

      setStage('resolving');

      try {
        const result = await reverseGeocode({
          geocoding: libraries.geocoding,
          lat,
          lng,
        });

        if (id !== requestId.current) return;

        if (!result || !result.place.formattedAddress) {
          setResolved(result ?? { place: { lat, lng }, parts: {} });
          setStage('noAddress');

          return;
        }

        setResolved(result);
        setStage('resolved');
      } catch {
        if (id !== requestId.current) return;

        setResolved({ place: { lat, lng }, parts: {} });
        setStage('geocodeFailed');
        trackLocationPicker('location_picker_failed', { stage: 'geocode' });
      }
    },
    [libraries],
  );

  const queueGeocode = useCallback(
    (next: { lat: number; lng: number }, nextZoom: number) => {
      setZoom(nextZoom);

      if (nextZoom < MIN_STREET_ZOOM) {
        if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
        requestId.current += 1;
        setStage('tooBroad');

        return;
      }

      const key = `${next.lat.toFixed(6)},${next.lng.toFixed(6)}`;

      if (key === lastGeocoded.current && stage !== 'tooBroad') return;

      lastGeocoded.current = key;

      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);

      geocodeTimer.current = setTimeout(() => {
        void runGeocode(next.lat, next.lng);
      }, GEOCODE_IDLE_MS);
    },
    [runGeocode, stage],
  );

  const handleUserMove = useCallback(() => {
    if (hasPinRef.current) return;

    hasPinRef.current = true;
    setHasPin(true);
    trackLocationPicker('location_picker_pin_moved', { method: 'drag' });
  }, []);

  const handleMapIdle = useCallback(
    (next: { lat: number; lng: number }, nextZoom: number) => {
      if (!hasPinRef.current) {
        setZoom(nextZoom);

        return;
      }

      queueGeocode(next, nextZoom);
    },
    [queueGeocode],
  );

  const handleMapPick = useCallback(
    (next: { lat: number; lng: number }, nextZoom: number) => {
      handleUserMove();
      setCenter(next);
      queueGeocode(next, nextZoom);
    },
    [handleUserMove, queueGeocode],
  );

  const handlePlacePicked = useCallback((result: Resolved) => {
    requestId.current += 1;
    lastGeocoded.current = `${result.place.lat.toFixed(6)},${result.place.lng.toFixed(6)}`;
    hasPinRef.current = true;
    setCenter({ lat: result.place.lat, lng: result.place.lng });
    setZoom(DEFAULT_ZOOM);
    setHasPin(true);
    setResolved(result);
    setStage(result.place.formattedAddress ? 'resolved' : 'noAddress');
    setIsSearchListOpen(false);
    trackLocationPicker('location_picker_pin_moved', { method: 'search' });
  }, []);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setIsGeolocationBlocked(true);

      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      position => {
        setIsLocating(false);
        hasPinRef.current = true;
        setCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setZoom(DEFAULT_ZOOM);
        setHasPin(true);
        lastGeocoded.current = null;
        trackLocationPicker('location_picker_pin_moved', {
          method: 'geolocate',
        });
      },
      () => {
        setIsLocating(false);
        setIsGeolocationBlocked(true);
        trackLocationPicker('location_picker_failed', { stage: 'geolocation' });
      },
      { timeout: GEOLOCATION_TIMEOUT_MS },
    );
  }, []);

  const formatted: FormattedLocation | null = useMemo(() => {
    if (!resolved) return null;

    return formatLocation(resolved.place, resolved.parts);
  }, [resolved]);

  const canConfirm =
    !isSearchListOpen &&
    (stage === 'resolved' ||
      stage === 'noAddress' ||
      stage === 'geocodeFailed');

  const confirmLabel = useMemo(() => {
    if (stage === 'noAddress') return COPY.actions.confirmCoordinates;
    if (stage === 'geocodeFailed') return COPY.actions.confirmAnyway;
    if (source === 'change') return COPY.actions.confirmUpdate;

    return COPY.actions.confirm;
  }, [source, stage]);

  const hint = useMemo(() => {
    if (stage === 'idle') return COPY.hints.dragMap;
    if (stage === 'tooBroad') return COPY.hints.zoomIn;
    if (stage === 'noAddress') return COPY.hints.noAddress;
    if (stage === 'resolved' || stage === 'geocodeFailed') {
      return COPY.hints.fineTune;
    }

    return null;
  }, [stage]);

  const writeBack = useCallback(() => {
    if (!resolved || !formatted) return;

    hasConfirmed.current = true;

    trackLocationPicker('location_picker_confirmed', {
      had_address: Boolean(resolved.place.formattedAddress),
      was_replacement: initialValue.trim().length > 0,
      zoom,
    });

    onConfirm({
      lat: resolved.place.lat,
      lng: resolved.place.lng,
      formatted: formatted.value,
      placeId: resolved.place.placeId,
    });
  }, [formatted, initialValue, onConfirm, resolved, zoom]);

  const requestConfirm = useCallback(() => {
    if (!canConfirm || !formatted) return;

    const typed = initialValue.trim();
    const isOverwritingTypedText =
      typed.length > 0 && typed !== formatted.value && !initialPin;

    if (isOverwritingTypedText) {
      setDialog('replace');

      return;
    }

    writeBack();
  }, [canConfirm, formatted, initialPin, initialValue, writeBack]);

  const dismiss = useCallback(
    (reason: 'cancel' | 'close' | 'discard') => {
      trackLocationPicker('location_picker_dismissed', { reason });
      onClose();
    },
    [onClose],
  );

  const requestClose = useCallback(
    (reason: 'cancel' | 'close') => {
      if (hasPin && !hasConfirmed.current && stage !== 'mapFailed') {
        setDialog('discard');

        return;
      }

      dismiss(reason);
    },
    [dismiss, hasPin, stage],
  );

  const resolveDialog = useCallback(
    (accepted: boolean) => {
      const open = dialog;

      setDialog(null);

      if (!accepted) return;
      if (open === 'replace') writeBack();
      if (open === 'discard') dismiss('discard');
    },
    [dialog, dismiss, writeBack],
  );

  const retryGeocode = useCallback(() => {
    if (!resolved) return;

    void runGeocode(resolved.place.lat, resolved.place.lng);
  }, [resolved, runGeocode]);

  return {
    libraries,
    stage,
    isSlow,
    center,
    zoom,
    hasPin,
    resolved,
    formatted,
    isTrimmed: Boolean(formatted?.wasTrimmed),
    maxLength: LOCATION_MAX_LENGTH,
    hint,
    canConfirm,
    confirmLabel,
    dialog,
    isSearchListOpen,
    isLocating,
    isGeolocationBlocked,
    setIsSearchListOpen,
    handleMapIdle,
    handleMapPick,
    handleUserMove,
    handlePlacePicked,
    locateMe,
    retryLoad,
    retryGeocode,
    requestConfirm,
    requestClose,
    resolveDialog,
  };
};
