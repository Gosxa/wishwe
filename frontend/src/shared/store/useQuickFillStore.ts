import { create } from 'zustand';
import { splitQuickFillWords } from '@/shared/lib/quickFill';

type QuickFillStore = {
  tourId: string | null;
  words: string[];
  start: (tourId: string, value: string) => void;
  stop: () => void;
};

const IDLE: Pick<QuickFillStore, 'tourId' | 'words'> = {
  tourId: null,
  words: [],
};

export const useQuickFillStore = create<QuickFillStore>(set => ({
  ...IDLE,

  start: (tourId, value) => set({ tourId, words: splitQuickFillWords(value) }),

  stop: () => set(state => (state.tourId === null ? state : IDLE)),
}));

export const useQuickFillWords = (tourId?: string): string[] | null =>
  useQuickFillStore(state =>
    tourId && state.tourId === tourId ? state.words : null,
  );
