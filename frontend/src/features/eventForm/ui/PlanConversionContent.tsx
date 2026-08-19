import clsx from 'clsx';
import type { BackendEventType } from '@/shared/client_api/event';
import { BadgeInfo } from '@shared/ui/icons';
import { HelperText } from '@shared/ui/helperText/HelperText';
import {
  PlanTimingFields,
  type PlanTimingFieldsProps,
} from './PlanTimingFields';
import s from './eventFormModal.module.scss';

type PreviewProps = {
  type: BackendEventType;
  coverUrl: string;
};

export const EventTypePreview = ({ type, coverUrl }: PreviewProps) => {
  const isPlan = type === 'plan';

  return (
    <div className={s.left}>
      <div className={s.typeBlock}>
        <div className={s.typePills}>
          <span className={clsx(s.typePill, isPlan && s.typePillActive)}>
            Plan
          </span>
          <span className={clsx(s.typePill, !isPlan && s.typePillActive)}>
            Wish
          </span>
        </div>
        <span className={s.typeHint}>
          <BadgeInfo />
          {isPlan
            ? 'Scheduled event with a fixed date.'
            : 'An idea for the future without a specific time.'}
        </span>
      </div>

      <div className={s.coverPreviewSlot}>
        <span className={s.label}>Cover</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.coverPreview} src={coverUrl} alt="Event cover" />
      </div>
    </div>
  );
};

type FieldsProps = PlanTimingFieldsProps & {
  eventTitle: string;
  submitError?: string;
};

export const PlanConversionFields = ({
  eventTitle,
  submitError,
  ...timing
}: FieldsProps) => (
  <div className={s.fields}>
    <div className={s.field}>
      <span className={s.label}>What?</span>
      <p className={s.readOnlyValue}>{eventTitle}</p>
    </div>

    <PlanTimingFields {...timing} />

    {submitError && <HelperText text={submitError} type="error" inline />}
  </div>
);
