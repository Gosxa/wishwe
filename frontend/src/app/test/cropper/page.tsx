'use client';

import { type ChangeEvent, useRef, useState } from 'react';
import { AvatarCrop } from '@/client_pages/onboard/widgets/personalDataForm/ui/avatarCrop/AvatarCrop';

export default function TestCropperPage() {
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => setRawImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onCropConfirm = (croppedUrl: string) => {
    setAvatarUrl(croppedUrl);
    setRawImageUrl(null);
  };

  const onCropCancel = () => setRawImageUrl(null);

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ marginBottom: 16 }}>Cropper test</h1>

      {rawImageUrl && (
        <AvatarCrop
          imageSrc={rawImageUrl}
          onConfirm={onCropConfirm}
          onCancel={onCropCancel}
        />
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          width: 200,
        }}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="avatar"
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: '#ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              No avatar
            </div>
          )}
        </button>

        <button onClick={() => fileInputRef.current?.click()}>
          Select photo
        </button>
        {avatarUrl && (
          <button onClick={() => setAvatarUrl(null)}>Remove</button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          hidden
        />
      </div>
    </div>
  );
}
