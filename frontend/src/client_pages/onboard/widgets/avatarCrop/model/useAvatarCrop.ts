import { useRef, useState } from 'react';
import { Area } from 'react-easy-crop';
import { getCroppedImg } from './cropImage';

type Conf = {
  onChange: (url: string) => void;
};

export const useAvatarCrop = ({ onChange }: Conf) => {
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

  const handle = {
    confirm: handleConfirm,
    cancel: handleCancel,
    fileChange: handleFileChange,
  };

  const set = {
    crop: setCrop,
    zoom: setZoom,
    areaPixels: setCroppedAreaPixels,
  };

  return {
    inputRef,
    rawImage,
    previewUrl,
    handle,
    crop,
    zoom,
    set,
  };
};
