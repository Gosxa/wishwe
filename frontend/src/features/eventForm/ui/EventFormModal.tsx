'use client';

import type { ComponentPropsWithRef } from 'react';
import { useBodyScrollLock } from '@/features/useBodyScrollLock/useBodyScrollLock';
import { useModalAttention } from '@shared/hooks/useModalAttention';
import { X } from '@shared/ui/icons';
import type { EventFormMode, EventFormModel } from '../model/types';
import { EVENT_FORM_COPY } from './eventFormCopy';
import { EventFormFields } from './EventFormFields';
import { EventTypePanel } from './EventTypePanel';
import s from './eventFormModal.module.scss';

type Props = {
  mode: EventFormMode;
  form: EventFormModel;
  onClose: () => void;
  overlayProps: ComponentPropsWithRef<'div'>;
};

export const EventFormModal = ({
  mode,
  form,
  onClose,
  overlayProps,
}: Props) => {
  const pulseModal = useModalAttention();
  const eventType = form.isPlan ? 'plan' : 'wish';
  const titleId = `${mode}EventTitle`;

  useBodyScrollLock();

  return (
    <div {...overlayProps} className={s.overlay} onClick={pulseModal}>
      <div
        data-modal-content
        className={s.modal}
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

        <EventTypePanel mode={mode} form={form} />

        <div className={s.right}>
          <h2 id={titleId} className={s.title}>
            {EVENT_FORM_COPY[mode].title[eventType]}
          </h2>

          <EventFormFields mode={mode} form={form} />

          <button
            type="button"
            className={s.submit}
            onClick={form.submit.onSubmit}
            disabled={
              (mode === 'create' && !form.hasRequiredFields) ||
              form.submit.isSubmitting ||
              form.cover.isProcessing
            }
          >
            <span>{EVENT_FORM_COPY[mode].submit}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
