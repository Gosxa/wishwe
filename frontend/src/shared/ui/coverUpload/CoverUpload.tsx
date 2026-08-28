'use client';

import { type DragEvent, useRef, useState } from 'react';
import clsx from 'clsx';
import { getCoverImageAcceptAttribute } from '@shared/lib/validation/imageUpload';
import { Pencil, Upload } from '@shared/ui/icons';
import { EventImage } from '@shared/ui/eventImage/EventImage';
import { HelperText } from '@shared/ui/helperText/HelperText';
import s from './coverUpload.module.scss';

type Props = {
  previewUrl: string | null;
  isUploading: boolean;
  isProcessing: boolean;
  onSelect: (file: File) => void;
  error?: string;
};

export const CoverUpload = ({
  previewUrl,
  isUploading,
  isProcessing,
  onSelect,
  error,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isBusy = isUploading || isProcessing;

  const openPicker = () => inputRef.current?.click();

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (!isBusy) setIsDragging(true);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (isBusy) return;

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
            <EventImage
              className={s.preview}
              src={previewUrl}
              alt="Event cover"
            />
            <button
              type="button"
              className={s.changeButton}
              onClick={openPicker}
              disabled={isBusy}
            >
              <span>
                {isProcessing
                  ? 'Processing...'
                  : isUploading
                    ? 'Uploading...'
                    : 'Change photo'}
              </span>
              {!isBusy && <Pencil />}
            </button>
          </>
        ) : (
          <div className={s.empty}>
            <Upload />
            <button
              type="button"
              className={s.browseButton}
              onClick={openPicker}
              disabled={isBusy}
            >
              <span>{isProcessing ? 'Processing...' : 'Browse'}</span>
            </button>
            <span className={s.dropHint}>or drop a file here</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={getCoverImageAcceptAttribute()}
          disabled={isBusy}
          hidden
          onChange={e => {
            const file = e.target.files?.[0];

            if (file) onSelect(file);

            if (inputRef.current) inputRef.current.value = '';
          }}
        />
      </div>

      {error && <HelperText text={error} type="error" inline />}
    </div>
  );
};
