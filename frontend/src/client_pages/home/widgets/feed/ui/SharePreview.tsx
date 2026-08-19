'use client';

import clsx from 'clsx';
import { SHARE_FORMATS } from '@client_pages/home/model/shareImage';
import type { ShareFormat } from '@client_pages/home/model/shareImage';
import s from './shareEventModal.module.scss';

type Props = {
  eventTitle: string;
  activeFormat: ShareFormat;
  activeUrl?: string;
  imageError: boolean;
  onSelect: (format: ShareFormat) => void;
  onMove: (direction: -1 | 1) => void;
};

export const SharePreview = ({
  eventTitle,
  activeFormat,
  activeUrl,
  imageError,
  onSelect,
  onMove,
}: Props) => {
  const activeSpec = SHARE_FORMATS.find(format => format.id === activeFormat)!;

  return (
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
            alt={`${activeSpec.label} share image for ${eventTitle}`}
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
          onClick={() => onMove(-1)}
          aria-label="Previous share format"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/share/arrow-prev.svg" alt="" />
        </button>
        <button
          type="button"
          className={clsx(s.arrow, s.arrowNext)}
          onClick={() => onMove(1)}
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
            className={clsx(s.dot, activeFormat === format.id && s.dotActive)}
            role="tab"
            aria-label={format.label}
            aria-selected={activeFormat === format.id}
            aria-controls="share-preview"
            onClick={() => onSelect(format.id)}
          />
        ))}
      </div>

      <p className={s.caption}>
        {imageError
          ? "Couldn't prepare the image. Link sharing is still available."
          : `${activeSpec.label}  ·  ${activeSpec.width} × ${activeSpec.height}  ·  ${activeSpec.description}`}
      </p>
    </div>
  );
};
