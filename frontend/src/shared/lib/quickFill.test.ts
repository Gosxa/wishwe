import { describe, expect, it } from 'vitest';
import {
  QUICK_FILL_STAGGER_MS,
  QUICK_FILL_WORD_MS,
  quickFillDuration,
  splitQuickFillWords,
} from './quickFill';

describe('splitQuickFillWords', () => {
  it('keeps whitespace so the words rejoin into the original value', () => {
    const value = 'Catch up over coffee or matcha?';
    const words = splitQuickFillWords(value);

    expect(words).toHaveLength(6);
    expect(words.join('')).toBe(value);
  });

  it('holds on to runs of whitespace and punctuation', () => {
    const value = 'Weather looks good,  why not sit outside?';

    expect(splitQuickFillWords(value).join('')).toBe(value);
  });

  it('returns nothing to animate for a blank value', () => {
    expect(splitQuickFillWords('')).toEqual([]);
    expect(splitQuickFillWords('   ')).toEqual([]);
  });
});

describe('quickFillDuration', () => {
  it('runs one word for the plain word duration', () => {
    expect(quickFillDuration(1)).toBe(QUICK_FILL_WORD_MS);
  });

  it('adds one stagger for every word after the first', () => {
    expect(quickFillDuration(6)).toBe(
      QUICK_FILL_WORD_MS + 5 * QUICK_FILL_STAGGER_MS,
    );
  });

  it('is instant when there is nothing to cascade', () => {
    expect(quickFillDuration(0)).toBe(0);
  });
});
