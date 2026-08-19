'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createShareLink } from '@/shared/client_api/event';
import type { FeedEvent } from './types';
import { generateShareImages, SHARE_FORMATS } from './shareImage';
import type { GeneratedShareImage, ShareFormat } from './shareImage';
import {
  buildSocialShareUrls,
  copyShareLink,
  fallbackShareLink,
  findShareImage,
  readStoredShareFormat,
  storeShareFormat,
  supportsImageClipboard,
  toCurrentOrigin,
} from './shareEvent';
import type { PreparedShareImage, ShareFeedback } from './shareEvent';

const FEEDBACK_DURATION_MS = 2000;

export const useShareEvent = (event: FeedEvent, isOwn: boolean) => {
  const eventId = event.id;
  const [activeFormat, setActiveFormat] = useState<ShareFormat>(
    readStoredShareFormat,
  );
  const [shareLink, setShareLink] = useState<string | null>(() =>
    isOwn ? null : fallbackShareLink(event.id),
  );
  const [images, setImages] = useState<PreparedShareImage[] | null>(null);
  const [imageError, setImageError] = useState(false);
  const [imageClipboard, setImageClipboard] = useState(supportsImageClipboard);
  const [feedback, setFeedback] = useState<ShareFeedback>('idle');
  const [announcement, setAnnouncement] = useState('');
  const [showLinkToast, setShowLinkToast] = useState(false);
  const linkPromiseRef = useRef<Promise<string> | null>(null);
  const imagesPromiseRef = useRef<Promise<GeneratedShareImage[]> | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventRef = useRef(event);

  useEffect(() => {
    eventRef.current = event;
  }, [event]);

  const getShareLink = useCallback(() => {
    if (!linkPromiseRef.current) {
      const fallback = fallbackShareLink(event.id);

      linkPromiseRef.current = isOwn
        ? createShareLink(event.id)
            .then(toCurrentOrigin)
            .catch(() => fallback)
        : Promise.resolve(fallback);
    }

    return linkPromiseRef.current;
  }, [event.id, isOwn]);

  const getShareImages = useCallback(() => {
    if (!imagesPromiseRef.current) {
      imagesPromiseRef.current = generateShareImages({
        ...eventRef.current,
        id: eventId,
      });
    }

    return imagesPromiseRef.current;
  }, [eventId]);

  useEffect(() => {
    let isActive = true;

    getShareLink().then(link => {
      if (isActive) setShareLink(link);
    });

    getShareImages()
      .then(generated => {
        if (!isActive) return;

        setImages(
          generated.map(image => ({
            ...image,
            url: URL.createObjectURL(image.blob),
          })),
        );
      })
      .catch(() => {
        if (isActive) setImageError(true);
      });

    return () => {
      isActive = false;
    };
  }, [getShareImages, getShareLink]);

  useEffect(() => {
    return () => {
      images?.forEach(image => URL.revokeObjectURL(image.url));
    };
  }, [images]);

  useEffect(() => {
    storeShareFormat(activeFormat);
  }, [activeFormat]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const setTemporaryFeedback = (
    nextFeedback: Exclude<ShareFeedback, 'idle'>,
  ) => {
    setFeedback(nextFeedback);

    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback('idle');
      setShowLinkToast(false);
    }, FEEDBACK_DURATION_MS);
  };

  const selectFormat = useCallback((format: ShareFormat) => {
    setActiveFormat(format);
  }, []);

  const moveSlide = useCallback((direction: -1 | 1) => {
    setActiveFormat(current => {
      const currentIndex = SHARE_FORMATS.findIndex(item => item.id === current);
      const nextIndex =
        (currentIndex + direction + SHARE_FORMATS.length) %
        SHARE_FORMATS.length;

      return SHARE_FORMATS[nextIndex].id;
    });
  }, []);

  const handleCopyLink = async () => {
    try {
      await copyShareLink(getShareLink());
      setTemporaryFeedback('link');
      setAnnouncement('Link copied!');
      setShowLinkToast(true);
    } catch {
      setAnnouncement("Couldn't copy the link. Please try again.");
    }
  };

  const handleCopyImage = async () => {
    const image = findShareImage(images, activeFormat);

    if (!image) return;

    try {
      const item = new ClipboardItem({ 'image/png': image.blob });

      await navigator.clipboard.write([item]);
      setTemporaryFeedback('image');
      setAnnouncement('Image copied!');
    } catch (error) {
      if (
        !supportsImageClipboard() ||
        (error instanceof DOMException && error.name === 'NotSupportedError')
      ) {
        setImageClipboard(false);
      }

      setAnnouncement(
        "This browser can't copy images. You can download the PNG instead.",
      );
    }
  };

  const activeImage = findShareImage(images, activeFormat);
  const storyImage = findShareImage(images, 'story');
  const activeSpec = SHARE_FORMATS.find(format => format.id === activeFormat)!;
  const socialUrls = useMemo(
    () => (shareLink ? buildSocialShareUrls(shareLink, event.title) : null),
    [event.title, shareLink],
  );

  return {
    activeFormat,
    activeImage,
    activeUrl: activeImage?.url,
    activeSpec,
    storyImage,
    storyUrl: storyImage?.url,
    imageError,
    imageClipboard,
    feedback,
    announcement,
    showLinkToast,
    socialUrls,
    selectFormat,
    moveSlide,
    handleCopyLink,
    handleCopyImage,
  };
};
