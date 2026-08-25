import { describe, expect, it } from 'vitest';
import { ONBOARDING_ORDER } from '@/shared/store/useOnboardingStore';
import { buildOnboardingSteps } from './onboardingSteps';
import { isPassthrough } from './types';

describe('buildOnboardingSteps', () => {
  it('covers every step of the flow, in order', () => {
    expect(buildOnboardingSteps({}).map(step => step.id)).toEqual(
      ONBOARDING_ORDER,
    );
  });

  it('greets the user by name when there is one', () => {
    expect(buildOnboardingSteps({ name: 'Mila' })[0].title).toContain('Mila');
  });

  it('falls back to a generic welcome without a name', () => {
    expect(buildOnboardingSteps({})[0].title).toBe('Welcome to WishWe 🚀');
  });

  it('aims the category step at the resolved category first', () => {
    const step = buildOnboardingSteps({
      categoryName: 'Food & Dining',
    }).find(item => item.id === 'category');

    expect(step?.anchor).toEqual([
      'category-food-dining',
      'category-food-drinks',
      'category-coffee-chats',
      'category-picker',
    ]);
  });

  it('falls back to the generic category anchors before one is resolved', () => {
    const step = buildOnboardingSteps({}).find(item => item.id === 'category');

    expect(step?.anchor).toEqual([
      'category-food-drinks',
      'category-food-dining',
      'category-coffee-chats',
      'category-picker',
    ]);
  });

  it('names the real category in the hint', () => {
    const step = buildOnboardingSteps({
      categoryName: 'Food & Dining',
      categoryLabel: 'food & Dining',
    }).find(item => item.id === 'category');

    expect(step?.hint).toContain('food & Dining');
  });

  it('waits on the user for every step that needs a click in the app', () => {
    const waiting = buildOnboardingSteps({})
      .filter(step => step.awaitAction)
      .map(step => step.id);

    expect(waiting).toEqual(['create', 'type', 'category', 'submit']);
  });

  it('only blocks the page on the two cards that are pure messages', () => {
    const blocking = buildOnboardingSteps({})
      .filter(step => !isPassthrough(step))
      .map(step => step.id);

    expect(blocking).toEqual(['welcome', 'done']);
  });

  it('offers a template for each field the user has to fill in', () => {
    const templated = buildOnboardingSteps({})
      .filter(step => step.quickFill)
      .map(step => step.id);

    expect(templated).toEqual([
      'title',
      'location',
      'description',
      'timeframe',
    ]);
  });
});
