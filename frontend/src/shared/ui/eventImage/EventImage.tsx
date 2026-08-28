'use client';

import {
  type ComponentPropsWithoutRef,
  type SyntheticEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { EVENT_IMAGE_FALLBACK } from '@shared/lib/mediaFallbacks';

type Props = Omit<ComponentPropsWithoutRef<'img'>, 'alt' | 'src'> & {
  src?: string | null;
  alt: string;
};

export const EventImage = ({ src, alt, onError, ...props }: Props) => {
  const source = src || EVENT_IMAGE_FALLBACK;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const resolvedSource =
    failedSource === source ? EVENT_IMAGE_FALLBACK : source;

  useEffect(() => {
    const image = imageRef.current;

    if (
      resolvedSource === EVENT_IMAGE_FALLBACK ||
      !image?.complete ||
      image.naturalWidth > 0
    ) {
      return;
    }

    let isMounted = true;

    queueMicrotask(() => {
      if (isMounted) setFailedSource(source);
    });

    return () => {
      isMounted = false;
    };
  }, [resolvedSource, source]);

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    onError?.(event);

    if (resolvedSource !== EVENT_IMAGE_FALLBACK) setFailedSource(source);
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      ref={imageRef}
      src={resolvedSource}
      alt={alt}
      onError={handleError}
    />
  );
};
