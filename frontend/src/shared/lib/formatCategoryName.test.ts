import { describe, expect, it } from 'vitest';
import {
  categoryTourId,
  formatCategoryDisplayName,
  formatCategoryHashtag,
} from './formatCategoryName';

describe('formatCategoryDisplayName', () => {
  it('lowercases only the first character', () => {
    expect(formatCategoryDisplayName('Food & Drinks')).toBe('food & Drinks');
  });
});

describe('formatCategoryHashtag', () => {
  it('prefixes the display name with a hash', () => {
    expect(formatCategoryHashtag('Outdoors')).toBe('#outdoors');
  });
});

describe('categoryTourId', () => {
  it('slugs a category name into a stable anchor', () => {
    expect(categoryTourId('Food & Drinks')).toBe('category-food-drinks');
  });

  it('collapses punctuation runs and trims the edges', () => {
    expect(categoryTourId('  Coffee  &&  Chats! ')).toBe(
      'category-coffee-chats',
    );
  });

  it('keeps digits', () => {
    expect(categoryTourId('Top 10')).toBe('category-top-10');
  });
});
