'use client';

import { useEffect } from 'react';
import { X } from '@shared/ui/icons';
import s from './shareErrorModal.module.scss';

type Props = {
  onClose: () => void;
  actionLabel: string;
};

export const ShareErrorModal = ({ onClose, actionLabel }: Props) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className={s.overlay} onClick={onClose}>
      <div
        className={s.modal}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="shareErrorTitle"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          className={s.close}
          onClick={onClose}
          aria-label="Close"
        >
          <X />
        </button>

        <h2 id="shareErrorTitle" className={s.title}>
          This link doesn&apos;t work anymore
        </h2>
        <p className={s.message}>
          The event was removed, or the host turned the link off. Ask them for a
          fresh one.
        </p>

        <button type="button" className={s.action} onClick={onClose}>
          <span>{actionLabel}</span>
        </button>
      </div>
    </div>
  );
};
