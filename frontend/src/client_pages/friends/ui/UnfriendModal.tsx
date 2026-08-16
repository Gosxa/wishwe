'use client';

import { useBodyScrollLock } from '@/features';
import { useModalAttention } from '@shared/hooks/useModalAttention';
import s from './unfriendModal.module.scss';

type Props = {
  username: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export const UnfriendModal = ({ username, onCancel, onConfirm }: Props) => {
  useBodyScrollLock();
  const pulseModal = useModalAttention();

  return (
    <div className={s.overlay} onClick={pulseModal}>
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
          <button type="button" className={s.cancel} onClick={onCancel}>
            <span>Cancel</span>
          </button>
          <button type="button" className={s.confirm} onClick={onConfirm}>
            <span>Unfriend</span>
          </button>
        </div>
      </div>
    </div>
  );
};
