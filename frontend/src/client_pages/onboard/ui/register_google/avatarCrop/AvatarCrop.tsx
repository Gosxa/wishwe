'use client';

import Image from 'next/image';
import Cropper from 'react-easy-crop';
import { useState, useRef } from 'react';
import type { Area } from 'react-easy-crop';
import { getCroppedImg } from './cropImage';
import s from './avatarCrop.module.scss';
import { Avatar } from '@/shared/ui/icons';

type Props = {
  onChange: (url: string) => void;
};

export const AvatarCrop = ({ onChange }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setRawImage(URL.createObjectURL(file));
  };

  const handleConfirm = async () => {
    if (!rawImage || !croppedAreaPixels) return;

    const croppedUrl = await getCroppedImg(rawImage, croppedAreaPixels);

    setPreviewUrl(croppedUrl);
    onChange(croppedUrl);
    setRawImage(null);
  };

  const handleCancel = () => {
    setRawImage(null);

    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={s.wrapper}>
      <button
        type="button"
        className={s.avatar}
        onClick={() => inputRef.current?.click()}
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Avatar preview"
            width={120}
            height={120}
            unoptimized
            className={s.preview}
          />
        ) : (
          <Avatar />
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={s.hiddenInput}
        onChange={handleFileChange}
      />

      <button
        type="button"
        className={s.changeBtn}
        onClick={() => inputRef.current?.click()}
      >
        <span> Change photo</span>
      </button>

      {rawImage && (
        <div className={s.overlay}>
          <div className={s.cropContainer}>
            <Cropper
              image={rawImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, areaPixels) =>
                setCroppedAreaPixels(areaPixels)
              }
            />
          </div>
          <div className={s.controls}>
            <button
              type="button"
              className={s.cancelBtn}
              onClick={handleCancel}
            >
              <span>Cancel</span>
            </button>
            <button
              type="button"
              className={s.confirmBtn}
              onClick={handleConfirm}
            >
              <span>Apply</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
