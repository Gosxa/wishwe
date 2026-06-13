import { create } from 'zustand';

type EventsRefreshStore = {
  refreshToken: number;
  requestRefresh: () => void;
};

export const useEventsRefreshStore = create<EventsRefreshStore>(set => ({
  refreshToken: 0,
  requestRefresh: () =>
    set(state => ({ refreshToken: state.refreshToken + 1 })),
}));
