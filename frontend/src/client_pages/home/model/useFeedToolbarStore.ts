import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FeedFilter, FeedReach, SortOption } from './types';

type FeedToolbarStore = {
  filter: FeedFilter;
  reach: FeedReach;
  sort: SortOption;
  _hasHydrated: boolean;
  setFilter: (filter: FeedFilter) => void;
  setReach: (reach: FeedReach) => void;
  setSort: (sort: SortOption) => void;
  setHasHydrated: (value: boolean) => void;
};

const initialState = {
  filter: 'all' as FeedFilter,
  reach: 'all' as FeedReach,
  sort: 'recent' as SortOption,
  _hasHydrated: false,
};

export const useFeedToolbarStore = create<FeedToolbarStore>()(
  persist(
    set => ({
      ...initialState,
      setFilter: filter => set({ filter }),
      setReach: reach => set({ reach }),
      setSort: sort => set({ sort }),
      setHasHydrated: value => set({ _hasHydrated: value }),
    }),
    {
      name: 'feed-toolbar',
      partialize: ({ filter, reach, sort }) => ({ filter, reach, sort }),
      onRehydrateStorage: () => state => state?.setHasHydrated(true),
    },
  ),
);
