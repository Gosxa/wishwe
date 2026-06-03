import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FeedFilter, FeedReach, SortOption } from './types';

type FeedToolbarStore = {
  filter: FeedFilter;
  reach: FeedReach;
  sort: SortOption;
  setFilter: (filter: FeedFilter) => void;
  setReach: (reach: FeedReach) => void;
  setSort: (sort: SortOption) => void;
};

const initialState = {
  filter: 'all' as FeedFilter,
  reach: 'all' as FeedReach,
  sort: 'recent' as SortOption,
};

export const useFeedToolbarStore = create<FeedToolbarStore>()(
  persist(
    set => ({
      ...initialState,
      setFilter: filter => set({ filter }),
      setReach: reach => set({ reach }),
      setSort: sort => set({ sort }),
    }),
    {
      name: 'feed-toolbar',
      partialize: ({ filter, reach, sort }) => ({ filter, reach, sort }),
    },
  ),
);
