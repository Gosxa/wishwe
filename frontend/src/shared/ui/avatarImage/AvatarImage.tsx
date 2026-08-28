'use client';

import {
  type ComponentPropsWithoutRef,
  type SyntheticEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Avatar } from '@shared/ui/icons';

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
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const hasFailed = !src || failedSource === src;

  useEffect(() => {
    const image = imageRef.current;

    if (hasFailed || !image?.complete || image.naturalWidth > 0) return;

    let isMounted = true;

    queueMicrotask(() => {
      if (isMounted) setFailedSource(src);
    });

    return () => {
      isMounted = false;
    };
  }, [hasFailed, src]);

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    onError?.(event);
    setFailedSource(src ?? null);
  };

  if (hasFailed) {
    return <Avatar width={fallbackWidth} height={fallbackHeight} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} ref={imageRef} src={src} alt={alt} onError={handleError} />
  );
};
