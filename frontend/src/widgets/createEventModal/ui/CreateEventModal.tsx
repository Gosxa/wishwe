'use client';

import { createPortal } from 'react-dom';
import type { BackendEventType } from '@/shared/client_api/event';
import { EventFormModal } from '@/features/eventForm';
import { useModalTransition } from '@shared/hooks/useModalTransition';
import { useCreateEvent } from '../model/useCreateEvent';

type Props = {
  onClose: () => void;
  onCreated: () => void;
  defaultType?: BackendEventType;
};

export const CreateEventModal = ({
  onClose,
  onCreated,
  defaultType,
}: Props) => {
  const { requestClose, requestCloseWith, modalTransitionProps } =
    useModalTransition(onClose);
  const form = useCreateEvent(() => requestCloseWith(onCreated), defaultType);

  return createPortal(
    <EventFormModal
      mode="create"
      form={form}
      onClose={requestClose}
      overlayProps={modalTransitionProps}
    />,
    document.body,
  );
};
