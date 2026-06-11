import { create } from 'zustand';

type LoadingStore = {
  isLoading: boolean;
  setLoading: (value: boolean) => void;
};

export const useLoadingStore = create<LoadingStore>(set => ({
  isLoading: false,
  setLoading: value => set({ isLoading: value }),
}));
