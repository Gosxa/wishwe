'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { archiveEvent } from '@/shared/client_api/event';
import type { FeedEvent } from '@client_pages/home/model/types';
import { DotsVertical } from '@shared/ui/icons';
import { ShareEventModal } from './ShareEventModal';
import s from './eventCardMenu.module.scss';

type Props = {
  event: FeedEvent;
  isOwn?: boolean;
  onCancelled?: () => void;
};

export const EventCardMenu = ({ event, isOwn = false, onCancelled }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  const handleShareEvent = () => {
    setIsOpen(false);
    setIsShareOpen(true);
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
      await archiveEvent(event.id);
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
        ref={triggerRef}
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
            className={clsx(s.item, s.share)}
            role="menuitem"
            onClick={handleShareEvent}
          >
            Share Event
          </button>

          {isOwn && event.type === 'plan' && (
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

      {isShareOpen &&
        createPortal(
          <ShareEventModal
            event={event}
            isOwn={isOwn}
            onClose={() => setIsShareOpen(false)}
            returnFocusRef={triggerRef}
          />,
          document.body,
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
    </div>
  );
};
