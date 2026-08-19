'use client';

import type {
  ComponentPropsWithRef,
  CSSProperties,
  MouseEventHandler,
  RefObject,
} from 'react';
import s from './shareEventModal.module.scss';

type Props = {
  modalRef: RefObject<HTMLDivElement | null>;
  proceedRef: RefObject<HTMLButtonElement | null>;
  transitionProps: ComponentPropsWithRef<'div'>;
  onBackdropClick: MouseEventHandler<HTMLDivElement>;
  dontShowAgain: boolean;
  onDontShowAgainChange: (checked: boolean) => void;
  onCancel: () => void;
  onProceed: () => void;
};

const iconStyle = (path: string) =>
  ({ '--share-icon': `url("${path}")` }) as CSSProperties;

export const InstagramShareNotice = ({
  modalRef,
  proceedRef,
  transitionProps,
  onBackdropClick,
  dontShowAgain,
  onDontShowAgainChange,
  onCancel,
  onProceed,
}: Props) => (
  <div
    {...transitionProps}
    className={s.confirmOverlay}
    role="presentation"
    onClick={onBackdropClick}
  >
    <div
      data-modal-content
      ref={modalRef}
      className={s.confirmModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="instagramNoticeTitle"
      aria-describedby="instagramNoticeDesc"
      onClick={event => event.stopPropagation()}
    >
      <div className={s.confirmIcon} aria-hidden="true">
        <span style={iconStyle('/icons/share/stories.svg')} />
      </div>

      <h3 id="instagramNoticeTitle" className={s.confirmTitle}>
        Post to Instagram Stories
      </h3>
      <p id="instagramNoticeDesc" className={s.confirmDescription}>
        We will save the 9:16 story image to your device and open Instagram so
        you can add it to your Stories.
      </p>

      <label className={s.confirmCheckbox}>
        <input
          type="checkbox"
          checked={dontShowAgain}
          onChange={event => onDontShowAgainChange(event.target.checked)}
        />
        <span>Don’t show this again</span>
      </label>

      <div className={s.confirmActions}>
        <button type="button" className={s.confirmCancel} onClick={onCancel}>
          <span>Cancel</span>
        </button>
        <button
          ref={proceedRef}
          type="button"
          className={s.confirmProceed}
          onClick={onProceed}
        >
          <span>Continue to Instagram</span>
        </button>
      </div>
    </div>
  </div>
);
