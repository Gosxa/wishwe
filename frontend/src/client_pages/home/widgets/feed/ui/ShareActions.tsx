'use client';

import clsx from 'clsx';
import type { FeedEvent } from '@client_pages/home/model/types';
import { shareImageFilename } from '@client_pages/home/model/shareImage';
import type { ShareFormat } from '@client_pages/home/model/shareImage';
import type {
  PreparedShareImage,
  ShareFeedback,
} from '@client_pages/home/model/shareEvent';
import s from './shareEventModal.module.scss';

type Props = {
  event: FeedEvent;
  activeFormat: ShareFormat;
  activeLabel: string;
  activeImage: PreparedShareImage | null;
  activeUrl?: string;
  imageClipboard: boolean;
  feedback: ShareFeedback;
  onCopyLink: () => void;
  onCopyImage: () => void;
};

const CopyLinkButton = ({
  feedback,
  fallback = false,
  onClick,
}: {
  feedback: ShareFeedback;
  fallback?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    className={clsx(
      s.copyLink,
      fallback && s.fallbackAction,
      feedback === 'link' && s.confirmed,
    )}
    onClick={onClick}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={
        feedback === 'link' ? '/icons/share/check.svg' : '/icons/share/link.svg'
      }
      alt=""
    />
    <span>{feedback === 'link' ? 'Link copied!' : 'Copy link'}</span>
  </button>
);

export const ShareActions = ({
  event,
  activeFormat,
  activeLabel,
  activeImage,
  activeUrl,
  imageClipboard,
  feedback,
  onCopyLink,
  onCopyImage,
}: Props) => {
  const filename = activeImage
    ? shareImageFilename(event, activeFormat)
    : undefined;

  if (!imageClipboard) {
    return (
      <div className={s.fallbackActions} data-tour="share-actions">
        <div className={s.actions}>
          <CopyLinkButton feedback={feedback} fallback onClick={onCopyLink} />
          {activeImage && activeUrl ? (
            <a
              className={clsx(s.downloadFallback, s.fallbackAction)}
              href={activeUrl}
              download={filename}
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
    );
  }

  return (
    <div className={s.actions} data-tour="share-actions">
      <CopyLinkButton feedback={feedback} onClick={onCopyLink} />
      <button
        type="button"
        className={clsx(s.copyImage, feedback === 'link' && s.copyImageMuted)}
        onClick={onCopyImage}
        disabled={!activeImage || !activeUrl}
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
        <span>{feedback === 'image' ? 'Image copied!' : 'Copy image'}</span>
      </button>
      {activeImage && activeUrl ? (
        <a
          className={s.download}
          href={activeUrl}
          download={filename}
          aria-label={`Download ${activeLabel} image`}
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
  );
};
