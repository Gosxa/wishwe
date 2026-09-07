'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { trackLocationPicker } from '@/shared/lib/googleMaps/analytics';
import { LOCATION_MAX_LENGTH } from '@/shared/lib/googleMaps/formatLocation';
import type { LocationPin } from '@/shared/lib/googleMaps/types';
import { LOCATION_PICKER_COPY as COPY } from '../copy';
import type { PickerDialog, PickerStage, ResolvedLocation } from './types';
import { useGeolocationWorkflow } from './useGeolocationWorkflow';
import { useGoogleMapsLoader } from './useGoogleMapsLoader';
import {
  MIN_STREET_ZOOM,
  usePinGeocodeWorkflow,
} from './usePinGeocodeWorkflow';

export { MIN_STREET_ZOOM };
export type { PickerDialog, PickerStage, PickerStep } from './types';

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
  const {
    libraries,
    status: mapsStatus,
    isSlow,
    retryLoad: retryMaps,
  } = useGoogleMapsLoader();
  const {
    stage: pinStage,
    center,
    zoom,
    hasPin,
    resolved,
    formatted,
    handleMapIdle,
    handleMapPick,
    handleUserMove,
    handlePlacePicked: setPickedPlace,
    handleLocated,
    prepareForMapReload,
    retryGeocode,
  } = usePinGeocodeWorkflow({
    initialPin,
    libraries,
  });
  const {
    step,
    isLocating,
    failure: geolocationFailure,
    isBlocked: isGeolocationBlocked,
    locateMe,
    allowLocation,
    enterManually,
    openMap,
  } = useGeolocationWorkflow({
    initialPin,
    onLocated: handleLocated,
  });
  const [dialog, setDialog] = useState<PickerDialog>(null);
  const [isSearchListOpen, setIsSearchListOpen] = useState(false);
  const hasConfirmed = useRef(false);

  const stage: PickerStage =
    mapsStatus === 'failed'
      ? 'mapFailed'
      : mapsStatus === 'loading'
        ? 'loading'
        : pinStage;

  useEffect(() => {
    trackLocationPicker('location_picker_opened', { mode, source });
  }, [mode, source]);

  const handlePlacePicked = useCallback(
    (result: ResolvedLocation) => {
      setPickedPlace(result);
      openMap();
      setIsSearchListOpen(false);
    },
    [openMap, setPickedPlace],
  );

  const retryLoad = useCallback(() => {
    prepareForMapReload();
    retryMaps();
  }, [prepareForMapReload, retryMaps]);

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

  return {
    libraries,
    stage,
    step,
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
    geolocationFailure,
    isGeolocationBlocked,
    setIsSearchListOpen,
    handleMapIdle,
    handleMapPick,
    handleUserMove,
    handlePlacePicked,
    locateMe,
    allowLocation,
    enterManually,
    retryLoad,
    retryGeocode,
    requestConfirm,
    requestClose,
    resolveDialog,
  };
};
