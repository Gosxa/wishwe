'use client';

import type { BackendEvent } from '@/shared/client_api/event';
import { EventFormModal } from '@/features/eventForm';
import { useModalTransition } from '@shared/hooks/useModalTransition';
import { useEditEvent } from '../model/useEditEvent';

type Props = {
  event: BackendEvent;
  onClose: () => void;
  onSaved: () => void;
};

export const EditEventModal = ({ event, onClose, onSaved }: Props) => {
  const { requestClose, requestCloseWith, modalTransitionProps } =
    useModalTransition(onClose);
  const form = useEditEvent(event, () => requestCloseWith(onSaved));

  return (
    <EventFormModal
      mode="edit"
      form={form}
      onClose={requestClose}
      overlayProps={modalTransitionProps}
    />
  );
};
