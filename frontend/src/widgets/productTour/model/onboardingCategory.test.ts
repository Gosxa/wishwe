import { describe, expect, it } from 'vitest';
import { pickOnboardingCategory } from './onboardingCategory';

describe('pickOnboardingCategory', () => {
  it('prefers an exact food and drinks category', () => {
    const categories = [
      { id: 1, name: 'Board Games' },
      { id: 2, name: 'Food & Drinks' },
      { id: 3, name: 'Coffee & Chats' },
    ];

    expect(pickOnboardingCategory(categories)).toEqual(categories[1]);
  });

  it('falls back to the closest food category the database happens to use', () => {
    const categories = [
      { id: 1, name: 'Board Games' },
      { id: 2, name: 'Food & Dining' },
    ];

    expect(pickOnboardingCategory(categories)).toEqual(categories[1]);
  });

  it('settles for coffee when nothing else mentions food', () => {
    const categories = [
      { id: 1, name: 'Tech & Coding' },
      { id: 2, name: 'Coffee & Chats' },
    ];

    expect(pickOnboardingCategory(categories)).toEqual(categories[1]);
  });

  it('takes the first category when none of them fit', () => {
    const categories = [
      { id: 1, name: 'Tech & Coding' },
      { id: 2, name: 'Board Games' },
    ];

    expect(pickOnboardingCategory(categories)).toEqual(categories[0]);
  });

  it('returns nothing when the list is empty', () => {
    expect(pickOnboardingCategory([])).toBeNull();
  });
});
