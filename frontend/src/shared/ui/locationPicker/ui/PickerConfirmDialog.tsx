'use client';

import { useRef, type KeyboardEvent } from 'react';
import { useFocusTrap } from '@/shared/hooks/useFocusTrap';
import { useModalAttention } from '@/shared/hooks/useModalAttention';
import { useModalTransition } from '@/shared/hooks/useModalTransition';
import { Pencil } from '../../icons';
import { LOCATION_PICKER_COPY as COPY } from '../copy';
import type { PickerDialog } from '../model/useLocationPicker';
import s from '../locationPicker.module.scss';

type Props = {
  kind: Exclude<PickerDialog, null>;
  currentValue?: string;
  onResolve: (accepted: boolean) => void;
};

export const PickerConfirmDialog = ({
  kind,
  currentValue,
  onResolve,
}: Props) => {
  const keepRef = useRef<HTMLButtonElement>(null);
  const pulseModal = useModalAttention();
  const { requestCloseWith, modalTransitionProps } = useModalTransition();
  const { containerProps } = useFocusTrap({ initialFocusRef: keepRef });

  const content = COPY.dialogs[kind];
  const titleId = `locationPicker-${kind}-title`;

  const handleResolve = (accepted: boolean) => {
    requestCloseWith(() => onResolve(accepted));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      handleResolve(false);

      return;
    }

    containerProps.onKeyDown?.(event);
  };

  return (
    <div
      {...modalTransitionProps}
      className={s.dialogLayer}
      onClick={pulseModal}
    >
      <div
        {...containerProps}
        onKeyDown={handleKeyDown}
        data-modal-content
        className={s.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h3 id={titleId} className={s.dialogTitle}>
          {content.title}
        </h3>
        <p className={s.dialogBody}>{content.body}</p>

        {kind === 'replace' && currentValue && (
          <p className={s.dialogPreview}>
            <span aria-hidden="true">
              <Pencil />
            </span>
            {currentValue}
          </p>
        )}

        <div className={s.dialogActions}>
          <button
            ref={keepRef}
            type="button"
            className={s.secondaryButton}
            onClick={() => handleResolve(false)}
          >
            <span>{content.keep}</span>
          </button>
          <button
            type="button"
            className={s.primaryButton}
            onClick={() => handleResolve(true)}
          >
            <span>{content.confirm}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
