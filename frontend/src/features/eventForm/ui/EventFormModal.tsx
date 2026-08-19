'use client';

import type { ComponentPropsWithRef } from 'react';
import type { EventFormMode, EventFormModel } from '../model/types';
import { EVENT_FORM_COPY } from './eventFormCopy';
import { EventFormFields } from './EventFormFields';
import { EventFormModalLayout } from './EventFormModalLayout';
import { EventTypePanel } from './EventTypePanel';

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
  const eventType = form.isPlan ? 'plan' : 'wish';
  const titleId = `${mode}EventTitle`;

  return (
    <EventFormModalLayout
      titleId={titleId}
      title={EVENT_FORM_COPY[mode].title[eventType]}
      sidebar={<EventTypePanel mode={mode} form={form} />}
      submitLabel={EVENT_FORM_COPY[mode].submit}
      submitDisabled={
        (mode === 'create' && !form.hasRequiredFields) ||
        form.submit.isSubmitting ||
        form.cover.isProcessing
      }
      onSubmit={form.submit.onSubmit}
      onClose={onClose}
      overlayProps={overlayProps}
    >
      <EventFormFields mode={mode} form={form} />
    </EventFormModalLayout>
  );
};
