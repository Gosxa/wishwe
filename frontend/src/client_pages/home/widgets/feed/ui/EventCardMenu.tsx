'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { DotsVertical } from '@shared/ui/icons';
import s from './eventCardMenu.module.scss';

type Props = {
  isOwn?: boolean;
};

export const EventCardMenu = ({ isOwn = false }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  // TODO: wire to backend
  const handleCopyLink = () => setIsOpen(false);
  const handleCancelEvent = () => setIsOpen(false);

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

          {isOwn && (
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
    </div>
  );
};
