'use client';

import { type DragEvent, useRef, useState } from 'react';
import clsx from 'clsx';
import { BadgeInfo, Pencil, Upload } from '@shared/ui/icons';
import { HelperText } from '@shared/ui/helperText/HelperText';
import s from './coverUpload.module.scss';

type Props = {
  previewUrl: string | null;
  isUploading: boolean;
  onSelect: (file: File) => void;
  error?: string;
};

export const CoverUpload = ({
  previewUrl,
  isUploading,
  onSelect,
  error,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const openPicker = () => inputRef.current?.click();

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (!isUploading) setIsDragging(true);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (isUploading) return;

    const file = e.dataTransfer.files?.[0];

    if (file) onSelect(file);
  };

  return (
    <div className={s.cover}>
      <div className={s.heading}>
        <h2 className={s.title}>Add a cover</h2>
        <p className={s.tip}>Pro tip: horizontal photos look best!</p>
      </div>

      <div
        className={clsx(s.dropArea, isDragging && s.dragging)}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={s.preview} src={previewUrl} alt="Event cover" />
            <button
              type="button"
              className={s.changeButton}
              onClick={openPicker}
              disabled={isUploading}
            >
              <span>{isUploading ? 'Uploading...' : 'Change photo'}</span>
              {!isUploading && <Pencil />}
            </button>
          </>
        ) : (
          <div className={s.empty}>
            <Upload />
            <button
              type="button"
              className={s.browseButton}
              onClick={openPicker}
              disabled={isUploading}
            >
              <span>Browse</span>
            </button>
            <span className={s.dropHint}>or drop a file here</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={e => {
            const file = e.target.files?.[0];

            if (file) onSelect(file);

            if (inputRef.current) inputRef.current.value = '';
          }}
        />
      </div>

      {error ? (
        <HelperText text={error} type="error" inline />
      ) : (
        <span className={s.formats}>
          <BadgeInfo />
          Supported formats: PNG, JPG, and WebP
        </span>
      )}
    </div>
  );
};
