'use client';

import {
  type ComponentPropsWithoutRef,
  type SyntheticEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Avatar } from '@shared/ui/icons';
import { toAbsoluteMediaUrl } from '@shared/lib/mediaUrl';

type Props = Omit<ComponentPropsWithoutRef<'img'>, 'alt' | 'src'> & {
  src?: string | null;
  alt: string;
  fallbackWidth?: number;
  fallbackHeight?: number;
};

export const AvatarImage = ({
  src,
  alt,
  fallbackWidth,
  fallbackHeight,
  onError,
  ...props
}: Props) => {
  const imageSrc = toAbsoluteMediaUrl(src);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const hasFailed = !imageSrc || failedSource === imageSrc;

  useEffect(() => {
    const image = imageRef.current;

    if (hasFailed || !image?.complete || image.naturalWidth > 0) return;

    let isMounted = true;

    queueMicrotask(() => {
      if (isMounted) setFailedSource(imageSrc);
    });

    return () => {
      isMounted = false;
    };
  }, [hasFailed, imageSrc]);

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    onError?.(event);
    setFailedSource(imageSrc);
  };

  if (hasFailed) {
    return <Avatar width={fallbackWidth} height={fallbackHeight} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      ref={imageRef}
      src={imageSrc ?? undefined}
      alt={alt}
      onError={handleError}
    />
  );
};
