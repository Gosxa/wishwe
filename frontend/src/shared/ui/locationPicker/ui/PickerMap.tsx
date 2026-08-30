'use client';

import clsx from 'clsx';
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { MapsLibraries } from '@/shared/lib/googleMaps/loadGoogleMaps';
import { Crosshair, Minus, Plus, TargetOff } from '../../icons';
import { LOCATION_PICKER_COPY as COPY } from '../copy';
import type { PickerStage } from '../model/useLocationPicker';
import s from '../locationPicker.module.scss';

type LatLng = { lat: number; lng: number };

const CLICK_DISTANCE_PX = 8;

type Props = {
  libraries: MapsLibraries;
  center: LatLng;
  zoom: number;
  stage: PickerStage;
  hint: string | null;
  hasPin: boolean;
  isLocating: boolean;
  isGeolocationBlocked: boolean;
  isDimmed: boolean;
  onIdle: (center: LatLng, zoom: number) => void;
  onPick: (center: LatLng, zoom: number) => void;
  onUserMove: () => void;
  onLocateMe: () => void;
  onBoundsChange: (bounds: google.maps.LatLngBounds | null) => void;
};

export const PickerMap = ({
  libraries,
  center,
  zoom,
  stage,
  hint,
  hasPin,
  isLocating,
  isGeolocationBlocked,
  isDimmed,
  onIdle,
  onPick,
  onUserMove,
  onLocateMe,
  onBoundsChange,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isReady, setIsReady] = useState(false);

  const handlers = useRef({ onIdle, onPick, onUserMove, onBoundsChange });
  const initialCamera = useRef({ center, zoom });

  useEffect(() => {
    handlers.current = { onIdle, onPick, onUserMove, onBoundsChange };
  }, [onIdle, onPick, onUserMove, onBoundsChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new libraries.maps.Map(containerRef.current, {
      center: initialCamera.current.center,
      zoom: initialCamera.current.zoom,
      disableDefaultUI: true,
      clickableIcons: false,
      keyboardShortcuts: false,
      gestureHandling: 'greedy',
    });

    setIsReady(true);
  }, [libraries]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    const idle = map.addListener('idle', () => {
      const nextCenter = map.getCenter();

      if (!nextCenter) return;

      handlers.current.onBoundsChange(map.getBounds() ?? null);
      handlers.current.onIdle(
        { lat: nextCenter.lat(), lng: nextCenter.lng() },
        map.getZoom() ?? 0,
      );
    });

    const dragStart = map.addListener('dragstart', () =>
      handlers.current.onUserMove(),
    );

    return () => {
      idle.remove();
      dragStart.remove();
    };
  }, [isReady]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    const current = map.getCenter();

    const isAlreadyCentered =
      current &&
      Math.abs(current.lat() - center.lat) < 1e-7 &&
      Math.abs(current.lng() - center.lng) < 1e-7;

    if (!isAlreadyCentered) map.panTo(center);

    const currentZoom = map.getZoom();

    if (currentZoom !== zoom) map.setZoom(zoom);
  }, [center, zoom]);

  const changeZoom = (delta: number) => {
    const map = mapRef.current;

    if (!map) return;

    map.setZoom((map.getZoom() ?? 0) + delta);
    handlers.current.onUserMove();
  };

  const isMapLink = (target: EventTarget | null) =>
    target instanceof Element && Boolean(target.closest('a, button'));

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isMapLink(event.target)) return;

    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    handlers.current.onUserMove();
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;

    pointerStartRef.current = null;

    if (!start || isMapLink(event.target)) return;
    if (
      Math.hypot(event.clientX - start.x, event.clientY - start.y) >
      CLICK_DISTANCE_PX
    ) {
      return;
    }

    const map = mapRef.current;
    const container = containerRef.current;
    const projection = map?.getProjection();
    const mapCenter = map?.getCenter();
    const mapZoom = map?.getZoom();

    if (!map || !container || !projection || !mapCenter || mapZoom == null) {
      return;
    }

    const centerPoint = projection.fromLatLngToPoint(mapCenter);

    if (!centerPoint) return;

    const rect = container.getBoundingClientRect();
    const scale = 2 ** mapZoom;
    const worldPoint = new libraries.core.Point(
      centerPoint.x + (event.clientX - rect.left - rect.width / 2) / scale,
      centerPoint.y + (event.clientY - rect.top - rect.height / 2) / scale,
    );
    const picked = projection.fromPointToLatLng(worldPoint, true);

    if (!picked) return;

    handlers.current.onPick(picked.toJSON(), mapZoom);
  };

  return (
    <div className={clsx(s.map, isDimmed && s.mapDimmed)}>
      <div
        ref={containerRef}
        className={s.mapCanvas}
        data-testid="location-picker-map-canvas"
        aria-hidden="true"
        onPointerDownCapture={handlePointerDown}
        onPointerUpCapture={handlePointerUp}
        onPointerCancel={() => {
          pointerStartRef.current = null;
        }}
        onWheelCapture={() => handlers.current.onUserMove()}
      />

      {isReady && (
        <span
          data-testid="location-picker-pin"
          className={clsx(
            s.pin,
            hasPin ? s.pinSolid : s.pinGhost,
            stage === 'noAddress' && s.pinWarn,
          )}
          aria-hidden="true"
        >
          {hasPin && stage === 'resolved' && <span className={s.pinHalo} />}
          <svg width="32" height="46" viewBox="0 0 32 48" fill="none">
            <path
              d="M16 42C16 42 30 23.5 30 15C30 7.27 23.73 1 16 1C8.27 1 2 7.27 2 15C2 23.5 16 42 16 42Z"
              fill="currentColor"
              stroke="#F7F3E3"
              strokeWidth="2"
            />
            <circle cx="16" cy="15" r="5" fill="#F7F3E3" />
          </svg>
        </span>
      )}

      {hint && !isDimmed && (
        <p
          className={clsx(s.hintChip, stage === 'noAddress' && s.hintChipWarn)}
        >
          {hint}
        </p>
      )}

      {!isDimmed && (
        <>
          <div className={s.zoom}>
            <button
              type="button"
              className={s.zoomButton}
              onClick={() => changeZoom(1)}
              aria-label="Zoom in"
            >
              <Plus />
            </button>
            <span className={s.zoomDivider} />
            <button
              type="button"
              className={s.zoomButton}
              onClick={() => changeZoom(-1)}
              aria-label="Zoom out"
            >
              <Minus />
            </button>
          </div>

          <button
            type="button"
            className={clsx(
              s.locateButton,
              isGeolocationBlocked && s.locateButtonBlocked,
            )}
            onClick={onLocateMe}
            disabled={isLocating || isGeolocationBlocked}
            aria-label={
              isGeolocationBlocked
                ? COPY.errors.geolocationBlocked
                : 'Use my location'
            }
            title={
              isGeolocationBlocked ? COPY.errors.geolocationBlocked : undefined
            }
          >
            {isGeolocationBlocked ? <TargetOff /> : <Crosshair />}
          </button>
        </>
      )}
    </div>
  );
};
