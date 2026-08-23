'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';
import clsx from 'clsx';
import { useBodyScrollLock } from '@/features/useBodyScrollLock/useBodyScrollLock';
import { useModalAttention } from '@shared/hooks/useModalAttention';
import { X } from '@shared/ui/icons';
import s from './eventFormModal.module.scss';

type Props = {
  titleId: string;
  title: string;
  sidebar: ReactNode;
  children: ReactNode;
  submitLabel: string;
  submitDisabled: boolean;
  compact?: boolean;
  onSubmit: () => void;
  onClose: () => void;
  overlayProps: ComponentPropsWithRef<'div'>;
};

export const EventFormModalLayout = ({
  titleId,
  title,
  sidebar,
  children,
  submitLabel,
  submitDisabled,
  compact = false,
  onSubmit,
  onClose,
  overlayProps,
}: Props) => {
  const pulseModal = useModalAttention();

  useBodyScrollLock();

  return (
    <div {...overlayProps} className={s.overlay} onClick={pulseModal}>
      <div
        data-modal-content
        className={clsx(s.modal, compact && s.modalCompact)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          type="button"
          className={s.close}
          onClick={onClose}
          aria-label="Close"
        >
          <X />
        </button>

        {sidebar}

        <div className={s.right}>
          <h2 id={titleId} className={s.title}>
            {title}
          </h2>

          {children}

          <button
            type="button"
            data-tour="event-submit"
            className={s.submit}
            onClick={onSubmit}
            disabled={submitDisabled}
          >
            <span>{submitLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
