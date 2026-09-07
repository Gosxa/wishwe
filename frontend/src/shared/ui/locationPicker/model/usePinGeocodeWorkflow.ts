'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { trackLocationPicker } from '@/shared/lib/googleMaps/analytics';
import { formatLocation } from '@/shared/lib/googleMaps/formatLocation';
import type { MapsLibraries } from '@/shared/lib/googleMaps/loadGoogleMaps';
import { reverseGeocode } from '@/shared/lib/googleMaps/placesService';
import type { LocationPin } from '@/shared/lib/googleMaps/types';
import type { LatLng, PinStage, ResolvedLocation } from './types';

export const MIN_STREET_ZOOM = 15;

const GEOCODE_IDLE_MS = 400;
const DEFAULT_ZOOM = 16;
const SETTLED_STAGES: PinStage[] = ['resolved', 'noAddress', 'geocodeFailed'];

type Options = {
  initialPin: LocationPin | null;
  libraries: MapsLibraries | null;
};

export const usePinGeocodeWorkflow = ({ initialPin, libraries }: Options) => {
  const [stage, setStage] = useState<PinStage>(
    initialPin ? 'resolving' : 'idle',
  );
  const [resolved, setResolved] = useState<ResolvedLocation | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [hasPin, setHasPin] = useState(Boolean(initialPin));
  const [center, setCenter] = useState<LatLng | null>(
    initialPin ? { lat: initialPin.lat, lng: initialPin.lng } : null,
  );

  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastGeocoded = useRef<string | null>(null);
  const requestId = useRef(0);
  const hasPinRef = useRef(Boolean(initialPin));
  const stageRef = useRef<PinStage>(stage);
  const settledStage = useRef<PinStage | null>(null);

  const updateStage = useCallback((next: PinStage) => {
    stageRef.current = next;
    setStage(next);
  }, []);

  useEffect(
    () => () => {
      requestId.current += 1;

      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    },
    [libraries],
  );

  const runGeocode = useCallback(
    async (lat: number, lng: number) => {
      if (!libraries) return;

      const id = ++requestId.current;

      updateStage('resolving');

      try {
        const result = await reverseGeocode({
          geocoding: libraries.geocoding,
          lat,
          lng,
        });

        if (id !== requestId.current) return;

        if (!result || !result.place.formattedAddress) {
          setResolved(result ?? { place: { lat, lng }, parts: {} });
          updateStage('noAddress');

          return;
        }

        setResolved(result);
        updateStage('resolved');
      } catch {
        if (id !== requestId.current) return;

        setResolved({ place: { lat, lng }, parts: {} });
        updateStage('geocodeFailed');
        trackLocationPicker('location_picker_failed', { stage: 'geocode' });
      }
    },
    [libraries, updateStage],
  );

  const queueGeocode = useCallback(
    (next: LatLng, nextZoom: number) => {
      setZoom(nextZoom);

      if (nextZoom < MIN_STREET_ZOOM) {
        if (geocodeTimer.current) clearTimeout(geocodeTimer.current);

        requestId.current += 1;
        settledStage.current = null;
        updateStage('tooBroad');

        return;
      }

      const key = `${next.lat.toFixed(6)},${next.lng.toFixed(6)}`;

      if (key === lastGeocoded.current && stageRef.current !== 'tooBroad') {
        if (settledStage.current) {
          updateStage(settledStage.current);
          settledStage.current = null;
        }

        return;
      }

      settledStage.current = null;
      lastGeocoded.current = key;

      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);

      geocodeTimer.current = setTimeout(() => {
        void runGeocode(next.lat, next.lng);
      }, GEOCODE_IDLE_MS);
    },
    [runGeocode, updateStage],
  );

  const handleUserMove = useCallback(() => {
    if (hasPinRef.current) {
      if (SETTLED_STAGES.includes(stageRef.current)) {
        settledStage.current = stageRef.current;
        updateStage('resolving');
      }

      return;
    }

    hasPinRef.current = true;
    setHasPin(true);
    trackLocationPicker('location_picker_pin_moved', { method: 'drag' });
  }, [updateStage]);

  const handleMapIdle = useCallback(
    (next: LatLng, nextZoom: number) => {
      if (!hasPinRef.current) {
        setZoom(nextZoom);

        return;
      }

      setCenter(next);
      queueGeocode(next, nextZoom);
    },
    [queueGeocode],
  );

  const handleMapPick = useCallback(
    (next: LatLng, nextZoom: number) => {
      handleUserMove();
      setCenter(next);
      queueGeocode(next, nextZoom);
    },
    [handleUserMove, queueGeocode],
  );

  const handlePlacePicked = useCallback(
    (result: ResolvedLocation) => {
      requestId.current += 1;

      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);

      settledStage.current = null;
      lastGeocoded.current = `${result.place.lat.toFixed(6)},${result.place.lng.toFixed(6)}`;
      hasPinRef.current = true;
      setCenter({ lat: result.place.lat, lng: result.place.lng });
      setZoom(DEFAULT_ZOOM);
      setHasPin(true);
      setResolved(result);
      updateStage(result.place.formattedAddress ? 'resolved' : 'noAddress');
      trackLocationPicker('location_picker_pin_moved', { method: 'search' });
    },
    [updateStage],
  );

  const handleLocated = useCallback(
    (position: LatLng) => {
      requestId.current += 1;

      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);

      hasPinRef.current = true;
      settledStage.current = null;
      lastGeocoded.current = null;
      setCenter(position);
      setZoom(DEFAULT_ZOOM);
      setHasPin(true);
      updateStage('resolving');
      trackLocationPicker('location_picker_pin_moved', {
        method: 'geolocate',
      });
    },
    [updateStage],
  );

  const prepareForMapReload = useCallback(() => {
    requestId.current += 1;

    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);

    lastGeocoded.current = null;
    settledStage.current = null;
    updateStage(hasPinRef.current ? 'resolving' : 'idle');
  }, [updateStage]);

  const retryGeocode = useCallback(() => {
    if (!resolved) return;

    void runGeocode(resolved.place.lat, resolved.place.lng);
  }, [resolved, runGeocode]);

  const formatted = useMemo(
    () => (resolved ? formatLocation(resolved.place, resolved.parts) : null),
    [resolved],
  );

  return {
    stage,
    center,
    zoom,
    hasPin,
    resolved,
    formatted,
    handleMapIdle,
    handleMapPick,
    handleUserMove,
    handlePlacePicked,
    handleLocated,
    prepareForMapReload,
    retryGeocode,
  };
};
