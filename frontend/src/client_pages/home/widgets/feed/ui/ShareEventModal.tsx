'use client';

import {
  type MouseEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useBodyScrollLock } from '@/features';
import { useModalAttention } from '@shared/hooks/useModalAttention';
import { useModalTransition } from '@shared/hooks/useModalTransition';
import type { FeedEvent } from '@client_pages/home/model/types';
import { shareImageFilename } from '@client_pages/home/model/shareImage';
import {
  readSkipInstagramNotice,
  saveSkipInstagramNotice,
} from '@client_pages/home/model/shareEvent';
import { useShareEvent } from '@client_pages/home/model/useShareEvent';
import { InstagramShareNotice } from './InstagramShareNotice';
import { ShareActions } from './ShareActions';
import { ShareDestinations } from './ShareDestinations';
import { SharePreview } from './SharePreview';
import s from './shareEventModal.module.scss';

type Props = {
  event: FeedEvent;
  isOwn: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

const FOCUSABLE =
  'a[href]:not([aria-disabled="true"]), button:not(:disabled), input:not(:disabled)';

export const ShareEventModal = ({
  event,
  isOwn,
  onClose,
  returnFocusRef,
}: Props) => {
  const share = useShareEvent(event, isOwn);
  const { moveSlide } = share;
  const [showInstagramNotice, setShowInstagramNotice] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const storiesLinkRef = useRef<HTMLAnchorElement>(null);
  const instagramNoticeProceedRef = useRef<HTMLButtonElement>(null);
  const instagramNoticeModalRef = useRef<HTMLDivElement>(null);
  const showInstagramNoticeRef = useRef(showInstagramNotice);

  useBodyScrollLock();
  const pulseModal = useModalAttention();
  const pulseInstagramNotice = useModalAttention(instagramNoticeModalRef);
  const { requestClose, modalTransitionProps } = useModalTransition(onClose);
  const {
    requestClose: requestInstagramNoticeClose,
    requestCloseWith: requestInstagramNoticeCloseWith,
    modalTransitionProps: instagramNoticeTransitionProps,
  } = useModalTransition(() => {
    setShowInstagramNotice(false);
    storiesLinkRef.current?.focus();
  });

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
      if (keyboardEvent.key === 'Escape' && showInstagramNoticeRef.current) {
        keyboardEvent.preventDefault();
        requestInstagramNoticeClose();

        return;
      }

      if (keyboardEvent.key === 'ArrowLeft') {
        if (showInstagramNoticeRef.current) return;

        keyboardEvent.preventDefault();
        moveSlide(-1);

        return;
      }

      if (keyboardEvent.key === 'ArrowRight') {
        if (showInstagramNoticeRef.current) return;

        keyboardEvent.preventDefault();
        moveSlide(1);

        return;
      }

      if (keyboardEvent.key !== 'Tab' || !dialog) return;

      const currentContainer =
        showInstagramNoticeRef.current && instagramNoticeModalRef.current
          ? instagramNoticeModalRef.current
          : dialog;
      const focusable = Array.from(
        currentContainer.querySelectorAll<HTMLElement>(FOCUSABLE),
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
  }, [moveSlide, requestInstagramNoticeClose, returnFocusRef]);

  const triggerStoryDownloadAndRedirect = () => {
    if (!share.storyImage || !share.storyUrl) return;

    const downloadLink = document.createElement('a');

    downloadLink.href = share.storyUrl;
    downloadLink.download = shareImageFilename(event, 'story');
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
  };

  const handleStoriesClick = (clickEvent: MouseEvent<HTMLAnchorElement>) => {
    share.selectFormat('story');

    if (!share.storyImage || !share.storyUrl) {
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
    if (dontShowAgain) saveSkipInstagramNotice(true);

    triggerStoryDownloadAndRedirect();
    requestInstagramNoticeCloseWith(() => {
      setShowInstagramNotice(false);
    });
  };

  return (
    <div
      {...modalTransitionProps}
      className={s.overlay}
      onClick={showInstagramNotice ? pulseInstagramNotice : pulseModal}
    >
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

        <div className={s.body}>
          <SharePreview
            eventTitle={event.title}
            activeFormat={share.activeFormat}
            activeUrl={share.activeUrl}
            imageError={share.imageError}
            onSelect={share.selectFormat}
            onMove={share.moveSlide}
          />
          <ShareDestinations
            event={event}
            activeFormat={share.activeFormat}
            socialUrls={share.socialUrls}
            storyImage={share.storyImage}
            storyUrl={share.storyUrl}
            storiesLinkRef={storiesLinkRef}
            onStoriesClick={handleStoriesClick}
          />
          <ShareActions
            event={event}
            activeFormat={share.activeFormat}
            activeLabel={share.activeSpec.label}
            activeImage={share.activeImage}
            activeUrl={share.activeUrl}
            imageClipboard={share.imageClipboard}
            feedback={share.feedback}
            onCopyLink={share.handleCopyLink}
            onCopyImage={share.handleCopyImage}
          />
        </div>

        {showInstagramNotice && (
          <InstagramShareNotice
            modalRef={instagramNoticeModalRef}
            proceedRef={instagramNoticeProceedRef}
            transitionProps={instagramNoticeTransitionProps}
            onBackdropClick={pulseInstagramNotice}
            dontShowAgain={dontShowAgain}
            onDontShowAgainChange={setDontShowAgain}
            onCancel={requestInstagramNoticeClose}
            onProceed={handleProceedInstagramNotice}
          />
        )}

        <span className={s.srOnly} aria-live="polite">
          {share.announcement}
        </span>
      </div>

      {share.showLinkToast && (
        <div className={s.toast} role="status">
          Link Copied!
        </div>
      )}
    </div>
  );
};
