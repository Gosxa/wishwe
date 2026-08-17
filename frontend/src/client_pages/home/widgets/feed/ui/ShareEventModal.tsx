'use client';

import {
  type CSSProperties,
  type MouseEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';
import { useBodyScrollLock } from '@/features';
import { useModalAttention } from '@shared/hooks/useModalAttention';
import { useModalTransition } from '@shared/hooks/useModalTransition';
import { createShareLink } from '@/shared/client_api/event';
import type { FeedEvent } from '@client_pages/home/model/types';
import {
  type GeneratedShareImage,
  SHARE_FORMATS,
  type ShareFormat,
  generateShareImages,
  shareImageFilename,
} from '@client_pages/home/model/shareImage';
import s from './shareEventModal.module.scss';

type Props = {
  event: FeedEvent;
  isOwn: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

type Feedback = 'idle' | 'link' | 'image';
type Network = 'telegram' | 'whatsapp' | 'x' | 'facebook';
type PreparedShareImage = GeneratedShareImage & { url: string };

const FORMAT_STORAGE_KEY = 'wishwe-share-format';
const SKIP_INSTAGRAM_NOTICE_KEY = 'wishwe-skip-instagram-notice';
const FEEDBACK_DURATION_MS = 2000;

const iconStyle = (path: string) =>
  ({ '--share-icon': `url("${path}")` }) as CSSProperties;

const currentOriginLink = (path: string) => {
  if (typeof window === 'undefined') return path;

  return `${window.location.origin}${path}`;
};

const fallbackShareLink = (eventId: string) =>
  currentOriginLink(`/feed?event=${eventId}`);

const toCurrentOrigin = (shareUrl: string) => {
  try {
    return currentOriginLink(new URL(shareUrl).pathname);
  } catch {
    return shareUrl;
  }
};

const readStoredFormat = (): ShareFormat => {
  if (typeof window === 'undefined') return 'poster';

  try {
    const stored = window.sessionStorage.getItem(FORMAT_STORAGE_KEY);

    return SHARE_FORMATS.some(format => format.id === stored)
      ? (stored as ShareFormat)
      : 'poster';
  } catch {
    return 'poster';
  }
};

const readSkipInstagramNotice = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(SKIP_INSTAGRAM_NOTICE_KEY) === 'true';
  } catch {
    return false;
  }
};

const saveSkipInstagramNotice = (skip: boolean) => {
  if (typeof window === 'undefined') return;

  try {
    if (skip) {
      window.localStorage.setItem(SKIP_INSTAGRAM_NOTICE_KEY, 'true');
    } else {
      window.localStorage.removeItem(SKIP_INSTAGRAM_NOTICE_KEY);
    }
  } catch {}
};

const supportsImageClipboard = () => {
  if (
    typeof ClipboardItem === 'undefined' ||
    typeof navigator.clipboard?.write !== 'function'
  ) {
    return false;
  }

  const clipboardItem = ClipboardItem as typeof ClipboardItem & {
    supports?: (type: string) => boolean;
  };

  return clipboardItem.supports?.('image/png') ?? true;
};

const copyText = async (linkPromise: Promise<string>) => {
  if (
    typeof ClipboardItem !== 'undefined' &&
    typeof navigator.clipboard?.write === 'function'
  ) {
    const item = new ClipboardItem({
      'text/plain': linkPromise.then(
        link => new Blob([link], { type: 'text/plain' }),
      ),
    });

    await navigator.clipboard.write([item]);

    return;
  }

  await navigator.clipboard.writeText(await linkPromise);
};

const socialShareUrl = (network: Network, link: string, title: string) => {
  const urls: Record<Network, URL> = {
    telegram: new URL('https://t.me/share/url'),
    whatsapp: new URL('https://wa.me/'),
    x: new URL('https://x.com/intent/post'),
    facebook: new URL('https://www.facebook.com/sharer/sharer.php'),
  };
  const url = urls[network];

  if (network === 'telegram') {
    url.searchParams.set('url', link);
    url.searchParams.set('text', title);
  } else if (network === 'whatsapp') {
    url.searchParams.set('text', `${title} ${link}`);
  } else if (network === 'x') {
    url.searchParams.set('text', title);
    url.searchParams.set('url', link);
  } else {
    url.searchParams.set('u', link);
  }

  return url.toString();
};

const findImage = (images: PreparedShareImage[] | null, format: ShareFormat) =>
  images?.find(image => image.format === format) ?? null;

export const ShareEventModal = ({
  event,
  isOwn,
  onClose,
  returnFocusRef,
}: Props) => {
  const [activeFormat, setActiveFormat] =
    useState<ShareFormat>(readStoredFormat);
  const [shareLink, setShareLink] = useState<string | null>(() =>
    isOwn ? null : fallbackShareLink(event.id),
  );
  const [images, setImages] = useState<PreparedShareImage[] | null>(null);
  const [imageError, setImageError] = useState(false);
  const [imageClipboard, setImageClipboard] = useState(supportsImageClipboard);
  const [feedback, setFeedback] = useState<Feedback>('idle');
  const [announcement, setAnnouncement] = useState('');
  const [showLinkToast, setShowLinkToast] = useState(false);
  const [showInstagramNotice, setShowInstagramNotice] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const storiesLinkRef = useRef<HTMLAnchorElement>(null);
  const instagramNoticeProceedRef = useRef<HTMLButtonElement>(null);
  const instagramNoticeModalRef = useRef<HTMLDivElement>(null);
  const linkPromiseRef = useRef<Promise<string> | null>(null);
  const imagesPromiseRef = useRef<Promise<GeneratedShareImage[]> | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useBodyScrollLock();
  const pulseModal = useModalAttention();
  const pulseInstagramNotice = useModalAttention();
  const { requestClose, modalTransitionProps } = useModalTransition(onClose);
  const {
    requestClose: requestInstagramNoticeClose,
    requestCloseWith: requestInstagramNoticeCloseWith,
    modalTransitionProps: instagramNoticeTransitionProps,
  } = useModalTransition(() => {
    setShowInstagramNotice(false);
    storiesLinkRef.current?.focus();
  });

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
      imagesPromiseRef.current = generateShareImages(event);
    }

    return imagesPromiseRef.current;
  }, [event]);

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

  const showInstagramNoticeRef = useRef(showInstagramNotice);

  useEffect(() => {
    showInstagramNoticeRef.current = showInstagramNotice;

    if (showInstagramNotice) {
      instagramNoticeProceedRef.current?.focus();
    }
  }, [showInstagramNotice]);

  useEffect(() => {
    const previousActive = document.activeElement as HTMLElement | null;
    const returnFocus = returnFocusRef.current ?? previousActive;
    const dialog = dialogRef.current;

    closeRef.current?.focus();

    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') {
        if (showInstagramNoticeRef.current) {
          keyboardEvent.preventDefault();
          requestInstagramNoticeClose();

          return;
        }
      }

      if (keyboardEvent.key === 'ArrowLeft') {
        if (showInstagramNoticeRef.current) return;

        keyboardEvent.preventDefault();
        setActiveFormat(current => {
          const index = SHARE_FORMATS.findIndex(item => item.id === current);

          return SHARE_FORMATS[
            (index - 1 + SHARE_FORMATS.length) % SHARE_FORMATS.length
          ].id;
        });

        return;
      }

      if (keyboardEvent.key === 'ArrowRight') {
        if (showInstagramNoticeRef.current) return;

        keyboardEvent.preventDefault();
        setActiveFormat(current => {
          const index = SHARE_FORMATS.findIndex(item => item.id === current);

          return SHARE_FORMATS[(index + 1) % SHARE_FORMATS.length].id;
        });

        return;
      }

      if (keyboardEvent.key !== 'Tab' || !dialog) return;

      const currentContainer =
        showInstagramNoticeRef.current && instagramNoticeModalRef.current
          ? instagramNoticeModalRef.current
          : dialog;

      const focusable = Array.from(
        currentContainer.querySelectorAll<HTMLElement>(
          'a[href]:not([aria-disabled="true"]), button:not(:disabled), input:not(:disabled)',
        ),
      );

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (keyboardEvent.shiftKey && document.activeElement === first) {
        keyboardEvent.preventDefault();
        last.focus();
      } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
        keyboardEvent.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      returnFocus?.focus();
    };
  }, [requestInstagramNoticeClose, returnFocusRef]);

  useEffect(() => {
    return () => {
      images?.forEach(image => URL.revokeObjectURL(image.url));
    };
  }, [images]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(FORMAT_STORAGE_KEY, activeFormat);
    } catch {}
  }, [activeFormat]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const setTemporaryFeedback = (nextFeedback: Exclude<Feedback, 'idle'>) => {
    setFeedback(nextFeedback);

    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback('idle');
      setShowLinkToast(false);
    }, FEEDBACK_DURATION_MS);
  };

  const selectFormat = (format: ShareFormat) => {
    setActiveFormat(format);
  };

  const moveSlide = (direction: -1 | 1) => {
    const currentIndex = SHARE_FORMATS.findIndex(
      item => item.id === activeFormat,
    );
    const nextIndex =
      (currentIndex + direction + SHARE_FORMATS.length) % SHARE_FORMATS.length;

    selectFormat(SHARE_FORMATS[nextIndex].id);
  };

  const handleCopyLink = async () => {
    try {
      await copyText(getShareLink());
      setTemporaryFeedback('link');
      setAnnouncement('Link copied!');
      setShowLinkToast(true);
    } catch {
      setAnnouncement("Couldn't copy the link. Please try again.");
    }
  };

  const handleCopyImage = async () => {
    const image = findImage(images, activeFormat);

    if (!image) return;

    try {
      const item = new ClipboardItem({ 'image/png': image.blob });

      await navigator.clipboard.write([item]);
      setTemporaryFeedback('image');
      setAnnouncement('Image copied!');
    } catch {
      setImageClipboard(false);
      setAnnouncement(
        "This browser can't copy images. You can download the PNG instead.",
      );
    }
  };

  const triggerStoryDownloadAndRedirect = () => {
    if (!storyImage || !storyUrl) return;

    const downloadLink = document.createElement('a');

    downloadLink.href = storyUrl;
    downloadLink.download = shareImageFilename(event, 'story');
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
  };

  const handleStoriesClick = (clickEvent: MouseEvent<HTMLAnchorElement>) => {
    selectFormat('story');

    if (!storyImage || !storyUrl) {
      clickEvent.preventDefault();

      return;
    }

    if (readSkipInstagramNotice()) {
      window.open(
        'https://www.instagram.com/',
        '_blank',
        'noopener,noreferrer',
      );

      return;
    }

    clickEvent.preventDefault();
    setShowInstagramNotice(true);
  };

  const handleProceedInstagramNotice = () => {
    if (dontShowAgain) {
      saveSkipInstagramNotice(true);
    }

    requestInstagramNoticeCloseWith(() => {
      setShowInstagramNotice(false);
      triggerStoryDownloadAndRedirect();
    });
  };

  const handleCancelInstagramNotice = () => {
    requestInstagramNoticeClose();
  };

  const activeImage = findImage(images, activeFormat);
  const activeUrl = activeImage?.url;
  const storyImage = findImage(images, 'story');
  const storyUrl = storyImage?.url;
  const isImageReady = Boolean(activeImage && activeUrl);
  const activeSpec = SHARE_FORMATS.find(format => format.id === activeFormat)!;
  const socialUrls = useMemo(
    () =>
      shareLink
        ? {
            telegram: socialShareUrl('telegram', shareLink, event.title),
            whatsapp: socialShareUrl('whatsapp', shareLink, event.title),
            x: socialShareUrl('x', shareLink, event.title),
            facebook: socialShareUrl('facebook', shareLink, event.title),
          }
        : null,
    [event.title, shareLink],
  );

  const handleTelegramClick = (clickEvent: MouseEvent<HTMLAnchorElement>) => {
    clickEvent.preventDefault();

    if (!socialUrls) return;

    window.open(
      socialUrls.telegram,
      'wishwe-telegram-share',
      'popup,width=620,height=640,noopener,noreferrer',
    );
  };

  const handleSocialClick = (clickEvent: MouseEvent<HTMLAnchorElement>) => {
    if (!socialUrls) clickEvent.preventDefault();
  };

  const networkItems = [
    {
      id: 'telegram',
      label: 'Telegram',
      href: socialUrls?.telegram,
      icon: '/icons/share/telegram.svg',
      onClick: handleTelegramClick,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      href: socialUrls?.whatsapp,
      icon: '/icons/share/whatsapp.svg',
      onClick: handleSocialClick,
    },
    {
      id: 'x',
      label: 'X',
      href: socialUrls?.x,
      icon: '/icons/share/x.svg',
      onClick: handleSocialClick,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      href: socialUrls?.facebook,
      icon: '/icons/share/facebook.svg',
      onClick: handleSocialClick,
    },
  ];

  return (
    <div {...modalTransitionProps} className={s.overlay} onClick={pulseModal}>
      <div
        data-modal-content
        ref={dialogRef}
        className={s.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shareEventTitle"
        onClick={clickEvent => clickEvent.stopPropagation()}
      >
        <div className={s.header}>
          <h2 id="shareEventTitle">Share this {event.type}</h2>
          <p>Post it or send the link</p>
        </div>

        <button
          ref={closeRef}
          type="button"
          className={s.close}
          onClick={requestClose}
          aria-label="Close share dialog"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/share/close.svg" alt="" />
        </button>

        <div className={s.carousel}>
          <div
            id="share-preview"
            className={s.stage}
            role="tabpanel"
            aria-labelledby={`share-format-${activeFormat}`}
            aria-label={`${activeSpec.label} preview`}
          >
            {activeUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={activeFormat}
                className={clsx(
                  s.preview,
                  activeFormat === 'story' && s.previewStory,
                )}
                src={activeUrl}
                alt={`${activeSpec.label} share image for ${event.title}`}
              />
            ) : (
              <div
                className={clsx(
                  s.skeleton,
                  activeFormat === 'story' && s.skeletonStory,
                )}
                role="status"
                aria-label={
                  imageError
                    ? 'Share image could not be prepared'
                    : 'Preparing share image'
                }
              >
                <span className={s.skeletonPill} />
                <span className={s.skeletonTitle} />
                <span className={s.skeletonLine} />
                <span className={s.skeletonLineShort} />
              </div>
            )}

            <button
              type="button"
              className={clsx(s.arrow, s.arrowPrevious)}
              onClick={() => moveSlide(-1)}
              aria-label="Previous share format"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/share/arrow-prev.svg" alt="" />
            </button>
            <button
              type="button"
              className={clsx(s.arrow, s.arrowNext)}
              onClick={() => moveSlide(1)}
              aria-label="Next share format"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/share/arrow-next.svg" alt="" />
            </button>
          </div>

          <div className={s.dots} role="tablist" aria-label="Share formats">
            {SHARE_FORMATS.map(format => (
              <button
                key={format.id}
                id={`share-format-${format.id}`}
                type="button"
                className={clsx(
                  s.dot,
                  activeFormat === format.id && s.dotActive,
                )}
                role="tab"
                aria-label={format.label}
                aria-selected={activeFormat === format.id}
                aria-controls="share-preview"
                onClick={() => selectFormat(format.id)}
              />
            ))}
          </div>

          <p className={s.caption}>
            {imageError
              ? "Couldn't prepare the image. Link sharing is still available."
              : `${activeSpec.label}  ·  ${activeSpec.width} × ${activeSpec.height}  ·  ${activeSpec.description}`}
          </p>
        </div>

        <div className={s.sectionLabel}>
          <span />
          <p>POST TO</p>
          <span />
        </div>

        <div className={s.networks}>
          {networkItems.map(item => (
            <a
              key={item.id}
              className={s.networkItem}
              href={item.href ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!item.href}
              onClick={item.onClick}
            >
              <span className={s.networkButton}>
                <span className={s.networkGlyph} style={iconStyle(item.icon)} />
              </span>
              <span>{item.label}</span>
            </a>
          ))}

          <a
            ref={storiesLinkRef}
            className={clsx(
              s.networkItem,
              s.stories,
              activeFormat === 'story' && s.networkActive,
            )}
            href={storyUrl ?? '#'}
            download={
              storyImage ? shareImageFilename(event, 'story') : undefined
            }
            aria-disabled={!storyImage || !storyUrl}
            data-tooltip="Saves the 9:16 image — post it in the app"
            onClick={handleStoriesClick}
          >
            <span className={s.networkButton}>
              <span
                className={s.networkGlyph}
                style={iconStyle('/icons/share/stories.svg')}
              />
            </span>
            <span>Stories</span>
          </a>
        </div>

        {imageClipboard ? (
          <div className={s.actions}>
            <button
              type="button"
              className={clsx(s.copyLink, feedback === 'link' && s.confirmed)}
              onClick={handleCopyLink}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  feedback === 'link'
                    ? '/icons/share/check.svg'
                    : '/icons/share/link.svg'
                }
                alt=""
              />
              <span>{feedback === 'link' ? 'Link copied!' : 'Copy link'}</span>
            </button>
            <button
              type="button"
              className={clsx(
                s.copyImage,
                feedback === 'link' && s.copyImageMuted,
              )}
              onClick={handleCopyImage}
              disabled={!isImageReady}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  feedback === 'image'
                    ? '/icons/share/check.svg'
                    : '/icons/share/image.svg'
                }
                alt=""
              />
              <span>
                {feedback === 'image' ? 'Image copied!' : 'Copy image'}
              </span>
            </button>
            {activeImage && activeUrl ? (
              <a
                className={s.download}
                href={activeUrl}
                download={shareImageFilename(event, activeFormat)}
                aria-label={`Download ${activeSpec.label} image`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/share/download.svg" alt="" />
              </a>
            ) : (
              <button
                type="button"
                className={s.download}
                aria-label="Download image"
                disabled
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/share/download.svg" alt="" />
              </button>
            )}
          </div>
        ) : (
          <div className={s.fallbackActions}>
            <div className={s.actions}>
              <button
                type="button"
                className={clsx(
                  s.copyLink,
                  s.fallbackAction,
                  feedback === 'link' && s.confirmed,
                )}
                onClick={handleCopyLink}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    feedback === 'link'
                      ? '/icons/share/check.svg'
                      : '/icons/share/link.svg'
                  }
                  alt=""
                />
                <span>
                  {feedback === 'link' ? 'Link copied!' : 'Copy link'}
                </span>
              </button>
              {activeImage && activeUrl ? (
                <a
                  className={clsx(s.downloadFallback, s.fallbackAction)}
                  href={activeUrl}
                  download={shareImageFilename(event, activeFormat)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/share/download-white.svg" alt="" />
                  <span>Download image</span>
                </a>
              ) : (
                <button
                  type="button"
                  className={clsx(s.downloadFallback, s.fallbackAction)}
                  disabled
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/share/download-white.svg" alt="" />
                  <span>Download image</span>
                </button>
              )}
            </div>
            <p className={s.fallbackNote}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/share/info.svg" alt="" />
              <span>
                This browser can’t copy images — the PNG downloads instead.
              </span>
            </p>
          </div>
        )}

        {showInstagramNotice && (
          <div
            {...instagramNoticeTransitionProps}
            className={s.confirmOverlay}
            role="presentation"
            onClick={pulseInstagramNotice}
          >
            <div
              data-modal-content
              ref={instagramNoticeModalRef}
              className={s.confirmModal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="instagramNoticeTitle"
              aria-describedby="instagramNoticeDesc"
              onClick={clickEvent => clickEvent.stopPropagation()}
            >
              <div className={s.confirmIcon} aria-hidden="true">
                <span style={iconStyle('/icons/share/stories.svg')} />
              </div>

              <h3 id="instagramNoticeTitle" className={s.confirmTitle}>
                Post to Instagram Stories
              </h3>
              <p id="instagramNoticeDesc" className={s.confirmDescription}>
                We will save the 9:16 story image to your device and open
                Instagram so you can add it to your Stories.
              </p>

              <label className={s.confirmCheckbox}>
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={checkboxEvent =>
                    setDontShowAgain(checkboxEvent.target.checked)
                  }
                />
                <span>Don’t show this again</span>
              </label>

              <div className={s.confirmActions}>
                <button
                  type="button"
                  className={s.confirmCancel}
                  onClick={handleCancelInstagramNotice}
                >
                  <span>Cancel</span>
                </button>
                <button
                  ref={instagramNoticeProceedRef}
                  type="button"
                  className={s.confirmProceed}
                  onClick={handleProceedInstagramNotice}
                >
                  <span>Continue to Instagram</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <span className={s.srOnly} aria-live="polite">
          {announcement}
        </span>
      </div>

      {showLinkToast && (
        <div className={s.toast} role="status">
          Link Copied!
        </div>
      )}
    </div>
  );
};
