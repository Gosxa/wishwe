'use client';

import { X } from '@shared/ui/icons';
import { useModalAttention } from '@shared/hooks/useModalAttention';
import { useModalTransition } from '@shared/hooks/useModalTransition';
import s from './shareErrorModal.module.scss';

type Props = {
  onClose: () => void;
  actionLabel: string;
};

export const ShareErrorModal = ({ onClose, actionLabel }: Props) => {
  const pulseModal = useModalAttention();
  const { requestClose, modalTransitionProps } = useModalTransition(onClose);

  return (
    <div {...modalTransitionProps} className={s.overlay} onClick={pulseModal}>
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
          onClick={requestClose}
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

        <button type="button" className={s.action} onClick={requestClose}>
          <span>{actionLabel}</span>
        </button>
      </div>
    </div>
  );
};
