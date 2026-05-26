'use client';

import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import s from './avatarCrop.module.scss';
import { Avatar } from '@/shared/ui/icons';
import { useAvatarCrop } from './model';

type Props = {
  onChange: (url: string) => void;
};

export const AvatarCrop = ({ onChange }: Props) => {
  const { inputRef, rawImage, previewUrl, handle, crop, zoom, set } =
    useAvatarCrop({
      onChange,
    });

  return (
    <div className={s.wrapper}>
      <button
        type="button"
        className={`${s.avatar}${previewUrl ? ` ${s.avatarHasPhoto}` : ''}`}
        onClick={() => inputRef.current?.click()}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Avatar preview" className={s.preview} />
        ) : (
          <Avatar />
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={s.hiddenInput}
        onChange={handle.fileChange}
      />

      <button
        type="button"
        className={s.changeBtn}
        onClick={() => inputRef.current?.click()}
      >
        <span> Change photo</span>
      </button>

      {rawImage &&
        createPortal(
          <div className={s.overlay}>
            <div className={s.cropContainer}>
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={set.crop}
                onZoomChange={set.zoom}
                onCropComplete={(_, areaPixels) => set.areaPixels(areaPixels)}
              />
            </div>
            <div className={s.controls}>
              <button
                type="button"
                className={s.cancelBtn}
                onClick={handle.cancel}
              >
                <span>Cancel</span>
              </button>
              <button
                type="button"
                className={s.confirmBtn}
                onClick={handle.confirm}
              >
                <span>Apply</span>
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
