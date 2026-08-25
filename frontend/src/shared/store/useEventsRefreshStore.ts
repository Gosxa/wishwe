import { create } from 'zustand';

type EventsRefreshStore = {
  refreshToken: number;
  isDeferred: boolean;
  isPending: boolean;
  revealEventId: string | null;
  requestRefresh: () => void;
  deferRefresh: (revealEventId?: string) => void;
  flushRefresh: () => void;
  clearReveal: () => void;
};

export const useEventsRefreshStore = create<EventsRefreshStore>(set => ({
  refreshToken: 0,
  isDeferred: false,
  isPending: false,
  revealEventId: null,

  requestRefresh: () =>
    set(state =>
      state.isDeferred
        ? { isPending: true }
        : { refreshToken: state.refreshToken + 1, isPending: false },
    ),

  deferRefresh: revealEventId =>
    set({ isDeferred: true, revealEventId: revealEventId ?? null }),

  flushRefresh: () =>
    set(state =>
      state.isPending
        ? {
            isDeferred: false,
            isPending: false,
            refreshToken: state.refreshToken + 1,
          }
        : { isDeferred: false, isPending: false, revealEventId: null },
    ),

  clearReveal: () => set({ revealEventId: null }),
}));
