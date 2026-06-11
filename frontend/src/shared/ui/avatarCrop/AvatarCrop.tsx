'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
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

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    const url = await cropImage(imageSrc, croppedAreaPixels);

    onConfirm(url);
  };

  return (
    <div className={s.overlay}>
      <div className={s.modal}>
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
          <button className={s.cancel} onClick={onCancel}>
            <span>Cancel</span>
          </button>
          <button className={s.confirm} onClick={handleConfirm}>
            <span>Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};
