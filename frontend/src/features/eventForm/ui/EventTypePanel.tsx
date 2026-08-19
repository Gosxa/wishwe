import clsx from 'clsx';
import { BadgeInfo } from '@shared/ui/icons';
import { CoverUpload } from '@shared/ui/coverUpload/CoverUpload';
import type { EventFormMode, EventFormModel } from '../model/types';
import s from './eventFormModal.module.scss';

type Props = {
  mode: EventFormMode;
  form: EventFormModel;
};

export const EventTypePanel = ({ mode, form }: Props) => {
  const { isPlan, onTypeChange, cover, submit } = form;

  return (
    <div className={s.left}>
      <div className={s.typeBlock}>
        <div className={s.typePills}>
          {mode === 'create' ? (
            <>
              <button
                type="button"
                className={clsx(
                  s.typePill,
                  s.typePillEditable,
                  isPlan && s.typePillActive,
                )}
                onClick={() => onTypeChange('plan')}
                aria-pressed={isPlan}
              >
                Plan
              </button>
              <button
                type="button"
                className={clsx(
                  s.typePill,
                  s.typePillEditable,
                  !isPlan && s.typePillActive,
                )}
                onClick={() => onTypeChange('wish')}
                aria-pressed={!isPlan}
              >
                Wish
              </button>
            </>
          ) : (
            <>
              <span className={clsx(s.typePill, isPlan && s.typePillActive)}>
                Plan
              </span>
              <span className={clsx(s.typePill, !isPlan && s.typePillActive)}>
                Wish
              </span>
            </>
          )}
        </div>
        <span className={s.typeHint}>
          <BadgeInfo />
          {isPlan
            ? 'Scheduled event with a fixed date.'
            : 'An idea for the future without a specific time.'}
        </span>
      </div>

      <div className={s.coverSlot}>
        <CoverUpload
          previewUrl={cover.previewUrl}
          isUploading={submit.isSubmitting}
          isProcessing={cover.isProcessing}
          onSelect={cover.onSelect}
          error={cover.error}
        />
      </div>
    </div>
  );
};
