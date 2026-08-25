export const QUICK_FILL_WORD_MS = 420;
export const QUICK_FILL_STAGGER_MS = 95;

export const splitQuickFillWords = (value: string): string[] =>
  value.match(/\s*\S+\s*/g) ?? [];

export const quickFillDuration = (wordCount: number): number =>
  wordCount > 0
    ? QUICK_FILL_WORD_MS + (wordCount - 1) * QUICK_FILL_STAGGER_MS
    : 0;
