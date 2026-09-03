'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useBodyScrollLock } from '@/features/useBodyScrollLock/useBodyScrollLock';
import { useFocusTrap } from '@/shared/hooks/useFocusTrap';
import { useModalAttention } from '@/shared/hooks/useModalAttention';
import { useModalTransition } from '@/shared/hooks/useModalTransition';
import type { LocationPin } from '@/shared/lib/googleMaps/types';
import { Keyboard, Refresh, WifiOff, X } from '../icons';
import { ModalPortal } from '../modalPortal/ModalPortal';
import { Spinner } from '../spinner/Spinner';
import { LOCATION_PICKER_COPY as COPY } from './copy';
import { useLocationPicker } from './model/useLocationPicker';
import { AddressCard } from './ui/AddressCard';
import { PickerConfirmDialog } from './ui/PickerConfirmDialog';
import { PickerIntro } from './ui/PickerIntro';
import { PickerMap } from './ui/PickerMap';
import { PlaceSearch } from './ui/PlaceSearch';
import s from './locationPicker.module.scss';

type Props = {
  mode: 'create' | 'edit';
  source: 'button' | 'change';
  initialValue: string;
  initialPin: LocationPin | null;
  onConfirm: (pin: LocationPin) => void;
  onClose: () => void;
};

const TITLE_ID = 'locationPickerTitle';

export const LocationPickerModal = ({
  mode,
  source,
  initialValue,
  initialPin,
  onConfirm,
  onClose,
}: Props) => {
  useBodyScrollLock();

  const pulseModal = useModalAttention();
  const { requestClose, requestCloseWith, modalTransitionProps } =
    useModalTransition(onClose);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const allowLocationRef = useRef<HTMLButtonElement>(null);
  const { containerProps } = useFocusTrap({ initialFocusRef: searchInputRef });
  const [bias, setBias] = useState<google.maps.LatLngBounds | null>(null);

  const picker = useLocationPicker({
    mode,
    source,
    initialValue,
    initialPin,
    onConfirm: pin => requestCloseWith(() => onConfirm(pin)),
    onClose: requestClose,
  });

  const isMapFailed = picker.stage === 'mapFailed';
  const isLoading = picker.stage === 'loading';
  const introStep = picker.step === 'map' ? null : picker.step;
  const focusedStep = useRef<string | null>(null);

  useEffect(() => {
    if (focusedStep.current === picker.step) return;

    focusedStep.current = picker.step;

    const target =
      picker.step === 'permission' || picker.step === 'locating'
        ? allowLocationRef.current
        : searchInputRef.current;

    target?.focus();
  }, [picker.step]);

  return (
    <ModalPortal>
      <div {...modalTransitionProps} className={s.overlay} onClick={pulseModal}>
        <div
          {...containerProps}
          data-modal-content
          className={s.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby={TITLE_ID}
        >
          <header className={s.header}>
            <h2 id={TITLE_ID} className={s.title}>
              {source === 'change' ? COPY.title.change : COPY.title.create}
            </h2>
            <button
              type="button"
              className={s.close}
              onClick={() => picker.requestClose('close')}
              aria-label="Close"
            >
              <X />
            </button>
          </header>

          <PlaceSearch
            libraries={picker.libraries}
            inputRef={searchInputRef}
            bias={bias}
            onPicked={picker.handlePlacePicked}
            onListOpenChange={picker.setIsSearchListOpen}
          />

          {isMapFailed ? (
            <div className={s.mapFallback}>
              <span className={s.mapFallbackIcon} aria-hidden="true">
                <WifiOff size={28} />
              </span>
              <p className={s.mapFallbackTitle}>
                {COPY.errors.mapFailed.title}
              </p>
              <p className={s.mapFallbackBody}>{COPY.errors.mapFailed.body}</p>
              <div className={s.mapFallbackActions}>
                <button
                  type="button"
                  className={s.secondaryButton}
                  onClick={picker.retryLoad}
                >
                  <Refresh />
                  <span>{COPY.actions.tryAgain}</span>
                </button>
                <button
                  type="button"
                  className={s.linkButton}
                  onClick={() => picker.requestClose('cancel')}
                >
                  <span>{COPY.actions.typeInstead}</span>
                </button>
              </div>
            </div>
          ) : introStep ? (
            <PickerIntro
              step={introStep}
              failure={picker.geolocationFailure}
              allowRef={allowLocationRef}
              onAllow={picker.allowLocation}
              onSkip={picker.enterManually}
            />
          ) : isLoading || !picker.libraries ? (
            <div className={s.mapSkeleton}>
              <Spinner inline />
              {picker.isSlow && (
                <p className={s.mapSkeletonNote}>{COPY.slowLoad}</p>
              )}
            </div>
          ) : picker.center ? (
            <PickerMap
              libraries={picker.libraries}
              center={picker.center}
              zoom={picker.zoom}
              stage={picker.stage}
              hint={picker.hint}
              hasPin={picker.hasPin}
              isLocating={picker.isLocating}
              isGeolocationBlocked={picker.isGeolocationBlocked}
              geolocationFailure={picker.geolocationFailure}
              isDimmed={picker.isSearchListOpen}
              onIdle={picker.handleMapIdle}
              onPick={picker.handleMapPick}
              onUserMove={picker.handleUserMove}
              onLocateMe={picker.locateMe}
              onBoundsChange={setBias}
            />
          ) : null}

          <AddressCard
            stage={picker.stage}
            step={picker.step}
            place={picker.resolved?.place ?? null}
            formatted={picker.formatted}
            maxLength={picker.maxLength}
            onRetryGeocode={picker.retryGeocode}
          />

          <footer className={s.footer}>
            {picker.isSearchListOpen && (
              <p className={s.keyboardHint}>
                <Keyboard />
                {COPY.keyboard.listOpen}
              </p>
            )}
            <div className={s.actions}>
              <button
                type="button"
                className={clsx(s.secondaryButton, s.cancelButton)}
                onClick={() => picker.requestClose('cancel')}
              >
                <span>{COPY.actions.cancel}</span>
              </button>
              <button
                type="button"
                className={clsx(s.primaryButton, s.confirmButton)}
                onClick={picker.requestConfirm}
                disabled={!picker.canConfirm}
              >
                <span>{picker.confirmLabel}</span>
              </button>
            </div>
          </footer>

          {picker.dialog && (
            <PickerConfirmDialog
              kind={picker.dialog}
              currentValue={initialValue}
              onResolve={picker.resolveDialog}
            />
          )}
        </div>
      </div>
    </ModalPortal>
  );
};
