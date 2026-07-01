'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { archiveEvent } from '@/shared/client_api/event';
import { DotsVertical } from '@shared/ui/icons';
import s from './eventCardMenu.module.scss';

type Props = {
  eventId: string;
  eventType: 'plan' | 'wish';
  isOwn?: boolean;
  onCancelled?: () => void;
};

export const EventCardMenu = ({
  eventId,
  eventType,
  isOwn = false,
  onCancelled,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/feed?event=${eventId}`;

    try {
      await navigator.clipboard.writeText(link);
      setIsLinkCopied(true);

      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }

      copiedTimeoutRef.current = setTimeout(() => {
        setIsLinkCopied(false);
      }, 2000);
    } catch {
      // clipboard unavailable — ignore
    } finally {
      setIsOpen(false);
    }
  };

  const handleCancelEvent = () => {
    setIsOpen(false);
    setIsConfirmOpen(true);
  };

  const handleConfirmClose = () => {
    if (!isCancelling) {
      setIsConfirmOpen(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (isCancelling) return;

    setIsCancelling(true);

    try {
      await archiveEvent(eventId);
      setIsConfirmOpen(false);
      onCancelled?.();
    } catch {
      // network failure — keep the dialog open
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className={s.root} ref={rootRef}>
      <button
        type="button"
        className={s.trigger}
        aria-label="Event options"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(current => !current)}
      >
        <DotsVertical />
      </button>

      {isOpen && (
        <div className={s.menu} role="menu">
          <button
            type="button"
            className={s.item}
            role="menuitem"
            onClick={handleCopyLink}
          >
            Copy link
          </button>

          {isOwn && eventType === 'plan' && (
            <>
              <div className={s.divider} />
              <button
                type="button"
                className={clsx(s.item, s.danger)}
                role="menuitem"
                onClick={handleCancelEvent}
              >
                Cancel event
              </button>
            </>
          )}
        </div>
      )}

      {isConfirmOpen &&
        createPortal(
          <div
            className={s.confirmOverlay}
            onClick={event => {
              event.stopPropagation();
              handleConfirmClose();
            }}
          >
            <div
              className={s.confirmDialog}
              role="dialog"
              onClick={event => event.stopPropagation()}
            >
              <h2 className={s.confirmTitle}>Cancel this event?</h2>
              <div className={s.confirmActions}>
                <button
                  type="button"
                  className={s.confirmCancel}
                  onClick={handleConfirmClose}
                  disabled={isCancelling}
                >
                  <span>No, thanks</span>
                </button>
                <button
                  type="button"
                  className={s.confirmConfirm}
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                >
                  <span>Cancel event</span>
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {isLinkCopied &&
        createPortal(
          <div className={s.toast} role="status">
            Link Copied!
          </div>,
          document.body,
        )}
    </div>
  );
};
