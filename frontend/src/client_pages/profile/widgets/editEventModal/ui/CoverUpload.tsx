'use client';

import { useRef } from 'react';
import { BadgeInfo, Pencil } from '@shared/ui/icons';
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

  return (
    <div className={s.cover}>
      <div className={s.heading}>
        <h2 className={s.title}>Add a cover</h2>
        <p className={s.tip}>Pro tip: horizontal photos look best!</p>
      </div>

      <div className={s.dropArea}>
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={s.preview} src={previewUrl} alt="Event cover" />
        )}
        <button
          type="button"
          className={s.changeButton}
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          <span>
            {isUploading
              ? 'Uploading...'
              : previewUrl
                ? 'Change photo'
                : 'Add a photo'}
          </span>
          {!isUploading && <Pencil />}
        </button>
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
