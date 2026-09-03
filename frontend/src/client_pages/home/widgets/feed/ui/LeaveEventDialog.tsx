import type {
  ComponentPropsWithRef,
  KeyboardEventHandler,
  MouseEventHandler,
  RefObject,
} from 'react';
import s from './eventCard.module.scss';

type Props = {
  isPending: boolean;
  cancelRef: RefObject<HTMLButtonElement | null>;
  transitionProps: ComponentPropsWithRef<'div'>;
  onBackdropClick: MouseEventHandler<HTMLDivElement>;
  onClose: () => void;
  onConfirm: () => void;
};

export const LeaveEventDialog = ({
  isPending,
  cancelRef,
  transitionProps,
  onBackdropClick,
  onClose,
  onConfirm,
}: Props) => {
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = keyboardEvent => {
    if (keyboardEvent.key === 'Escape') {
      keyboardEvent.preventDefault();
      onClose();

      return;
    }

    if (keyboardEvent.key !== 'Tab') return;

    const buttons = Array.from(
      keyboardEvent.currentTarget.querySelectorAll<HTMLButtonElement>(
        'button:not(:disabled)',
      ),
    );

    if (buttons.length === 0) return;

    const first = buttons[0];
    const last = buttons[buttons.length - 1];

    if (keyboardEvent.shiftKey && document.activeElement === first) {
      keyboardEvent.preventDefault();
      last.focus();
    } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
      keyboardEvent.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      {...transitionProps}
      className={s.leaveOverlay}
      onClick={onBackdropClick}
    >
      <div
        data-modal-content
        className={s.leaveDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="leaveEventTitle"
        onKeyDown={handleKeyDown}
      >
        <h2 id="leaveEventTitle" className={s.leaveDialogTitle}>
          Leave this event?
        </h2>
        <div className={s.leaveDialogActions}>
          <button
            ref={cancelRef}
            type="button"
            className={s.noThanksButton}
            onClick={onClose}
            disabled={isPending}
          >
            <span>No, thanks</span>
          </button>
          <button
            type="button"
            className={s.leaveButton}
            onClick={onConfirm}
            disabled={isPending}
          >
            <span>Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
};
