'use client';

import { useEffect, useRef, useState } from 'react';
import {
  isAllowedCoverImage,
  MAX_COVER_IMAGE_SIZE,
  prepareCoverImage,
} from '@/shared/lib/validation/imageUpload';
import type { EventFormModel } from './types';

type Options = {
  initialPreviewUrl: string | null;
  error?: string;
  onErrorChange: (error?: string) => void;
};

type EventCover = {
  file: File | null;
  model: EventFormModel['cover'];
};

export const useEventCover = ({
  initialPreviewUrl,
  error,
  onErrorChange,
}: Options): EventCover => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(initialPreviewUrl);
  const [isProcessing, setIsProcessing] = useState(false);
  const selectionIdRef = useRef(0);

  useEffect(
    () => () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl],
  );

  useEffect(
    () => () => {
      selectionIdRef.current += 1;
    },
    [],
  );

  const onSelect = async (selectedFile: File) => {
    const selectionId = ++selectionIdRef.current;

    setFile(null);

    if (!isAllowedCoverImage(selectedFile)) {
      setIsProcessing(false);
      onErrorChange('Unsupported image format');

      return;
    }

    if (selectedFile.size > MAX_COVER_IMAGE_SIZE) {
      setIsProcessing(false);
      onErrorChange('Image must be 5 MB or less');

      return;
    }

    setIsProcessing(true);

    try {
      const preparedFile = await prepareCoverImage(selectedFile);

      if (selectionId !== selectionIdRef.current) return;

      if (preparedFile.size > MAX_COVER_IMAGE_SIZE) {
        onErrorChange('Converted image must be 5 MB or less');

        return;
      }

      setFile(preparedFile);
      setPreviewUrl(URL.createObjectURL(preparedFile));
      onErrorChange(undefined);
    } catch {
      if (selectionId === selectionIdRef.current) {
        onErrorChange('Could not process this image');
      }
    } finally {
      if (selectionId === selectionIdRef.current) {
        setIsProcessing(false);
      }
    }
  };

  return {
    file,
    model: {
      previewUrl,
      onSelect,
      error,
      isProcessing,
    },
  };
};
