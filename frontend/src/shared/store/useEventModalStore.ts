import { create } from 'zustand';

type EventModalStore = {
  eventId: string | null;
  open: (eventId: string) => void;
  close: () => void;
};

export const useEventModalStore = create<EventModalStore>(set => ({
  eventId: null,
  open: eventId => set({ eventId }),
  close: () => set({ eventId: null }),
}));
