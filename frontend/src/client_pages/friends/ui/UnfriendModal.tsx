'use client';

import { useState } from 'react';
import { useBodyScrollLock } from '@/features';
import { useModalAttention } from '@shared/hooks/useModalAttention';
import { useModalTransition } from '@shared/hooks/useModalTransition';
import s from './unfriendModal.module.scss';

type Props = {
  username: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export const UnfriendModal = ({ username, onCancel, onConfirm }: Props) => {
  const [isConfirming, setIsConfirming] = useState(false);

  useBodyScrollLock();
  const pulseModal = useModalAttention();
  const { requestClose, modalTransitionProps } = useModalTransition(onCancel);

  const handleConfirm = async () => {
    if (isConfirming) return;

    setIsConfirming(true);

    try {
      await onConfirm();
      requestClose();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div {...modalTransitionProps} className={s.overlay} onClick={pulseModal}>
      <div
        data-modal-content
        className={s.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unfriendTitle"
      >
        <h2 id="unfriendTitle" className={s.title}>
          Unfriend @{username}?
        </h2>

        <div className={s.actions}>
          <button
            type="button"
            className={s.cancel}
            onClick={requestClose}
            disabled={isConfirming}
          >
            <span>Cancel</span>
          </button>
          <button
            type="button"
            className={s.confirm}
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            <span>Unfriend</span>
          </button>
        </div>
      </div>
    </div>
  );
};
