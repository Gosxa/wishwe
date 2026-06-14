import { create } from 'zustand';
import type { BackendEventType } from '@/shared/client_api/event';

type CreateEventStore = {
  isOpen: boolean;
  defaultType: BackendEventType;
  open: (type?: BackendEventType) => void;
  close: () => void;
};

export const useCreateEventStore = create<CreateEventStore>(set => ({
  isOpen: false,
  defaultType: 'plan',
  open: (type = 'plan') => set({ isOpen: true, defaultType: type }),
  close: () => set({ isOpen: false }),
}));
