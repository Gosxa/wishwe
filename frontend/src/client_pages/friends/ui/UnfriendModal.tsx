'use client';

import { useEffect } from 'react';
import { useBodyScrollLock } from '@/features';
import s from './unfriendModal.module.scss';

type Props = {
  username: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export const UnfriendModal = ({ username, onCancel, onConfirm }: Props) => {
  useBodyScrollLock();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  return (
    <div className={s.overlay}>
      <div
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
