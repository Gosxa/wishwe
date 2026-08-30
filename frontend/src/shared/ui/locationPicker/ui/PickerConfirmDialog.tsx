'use client';

import { useEffect, useRef } from 'react';
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
  const content = COPY.dialogs[kind];
  const titleId = `locationPicker-${kind}-title`;

  useEffect(() => {
    keepRef.current?.focus();
  }, []);

  return (
    <div className={s.dialogLayer}>
      <div
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
            onClick={() => onResolve(false)}
          >
            <span>{content.keep}</span>
          </button>
          <button
            type="button"
            className={s.primaryButton}
            onClick={() => onResolve(true)}
          >
            <span>{content.confirm}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
