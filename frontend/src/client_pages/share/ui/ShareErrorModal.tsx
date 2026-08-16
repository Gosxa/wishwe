'use client';

import { X } from '@shared/ui/icons';
import { useModalAttention } from '@shared/hooks/useModalAttention';
import s from './shareErrorModal.module.scss';

type Props = {
  onClose: () => void;
  actionLabel: string;
};

export const ShareErrorModal = ({ onClose, actionLabel }: Props) => {
  const pulseModal = useModalAttention();

  return (
    <div className={s.overlay} onClick={pulseModal}>
      <div
        data-modal-content
        className={s.modal}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="shareErrorTitle"
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
