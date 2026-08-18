'use client';

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { useBodyScrollLock } from '@/features';
import { useModalAttention } from '@shared/hooks/useModalAttention';
import { useModalTransition } from '@shared/hooks/useModalTransition';
import { cropImage } from './cropImage';
import s from './avatarCrop.module.scss';

type Props = {
  imageSrc: string;
  onConfirm: (croppedUrl: string) => void;
  onCancel: () => void;
};

export const AvatarCrop = ({ imageSrc, onConfirm, onCancel }: Props) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const pulseModal = useModalAttention();
  const { requestClose, requestCloseWith, modalTransitionProps } =
    useModalTransition(onCancel);

  useBodyScrollLock();

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    const url = await cropImage(imageSrc, croppedAreaPixels);

    requestCloseWith(() => onConfirm(url));
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div {...modalTransitionProps} className={s.overlay} onClick={pulseModal}>
      <div
        data-modal-content
        className={s.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Crop profile photo"
      >
        <div className={s.cropArea}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className={s.actions}>
          <button className={s.cancel} onClick={requestClose}>
            <span>Cancel</span>
          </button>
          <button className={s.confirm} onClick={handleConfirm}>
            <span>Apply</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
