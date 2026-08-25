import { create } from 'zustand';
import type { BackendEvent } from '@/shared/client_api/event';

type CreatedEventShareStore = {
  event: BackendEvent | null;
  open: (event: BackendEvent) => void;
  close: () => void;
};

export const useCreatedEventShareStore = create<CreatedEventShareStore>(
  set => ({
    event: null,
    open: event => set({ event }),
    close: () => set({ event: null }),
  }),
);
