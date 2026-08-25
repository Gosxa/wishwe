import { beforeEach, describe, expect, it } from 'vitest';
import type { BackendEvent } from '@/shared/client_api/event';
import {
  useOnboardingStore,
  type OnboardingFormBridge,
} from './useOnboardingStore';

const bridge = (
  overrides: Partial<OnboardingFormBridge> = {},
): OnboardingFormBridge => ({
  isWish: true,
  categories: [{ id: 1, name: 'Food & Drinks' }],
  selectedCategoryId: 1,
  values: {
    title: 'Coffee?',
    location: 'Downtown',
    description: '',
    timeframe: 'This weekend',
  },
  canSubmit: true,
  chooseType: () => {},
  chooseCategory: () => {},
  fill: () => {},
  ...overrides,
});

const { begin, advance, syncForm, reportCreated, end, dismissShare } =
  useOnboardingStore.getState();

const step = () => useOnboardingStore.getState().step;

const createdEvent = { id: 42 } as BackendEvent;

describe('useOnboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.setState({ step: null, form: null, createdEvent: null });
  });

  it('opens on the welcome card', () => {
    begin();

    expect(step()).toBe('welcome');
  });

  it('walks forward one step at a time', () => {
    begin();
    advance();

    expect(step()).toBe('create');
  });

  it('stops advancing past the last step', () => {
    useOnboardingStore.setState({ step: 'done' });
    advance();

    expect(step()).toBe('done');
  });

  it('stays quiet when the tour is not running', () => {
    advance();
    syncForm(bridge());
    reportCreated(createdEvent);

    expect(useOnboardingStore.getState()).toMatchObject({
      step: null,
      form: null,
      createdEvent: null,
    });
  });

  it('moves on to the type step once the create modal opens', () => {
    useOnboardingStore.setState({ step: 'create' });
    syncForm(bridge({ isWish: false }));

    expect(step()).toBe('type');
  });

  it('waits on the type step until wish is picked', () => {
    useOnboardingStore.setState({ step: 'type' });
    syncForm(bridge({ isWish: false }));

    expect(step()).toBe('type');

    syncForm(bridge({ isWish: true, selectedCategoryId: null }));

    expect(step()).toBe('category');
  });

  it('waits on the category step until one is chosen', () => {
    useOnboardingStore.setState({ step: 'category' });
    syncForm(bridge({ selectedCategoryId: null }));

    expect(step()).toBe('category');

    syncForm(bridge({ selectedCategoryId: 3 }));

    expect(step()).toBe('title');
  });

  it('walks back to the type step if the user switches to a plan', () => {
    useOnboardingStore.setState({ step: 'timeframe' });
    syncForm(bridge({ isWish: false }));

    expect(step()).toBe('type');
  });

  it('walks back to the create step if the modal is closed', () => {
    useOnboardingStore.setState({ step: 'title' });
    syncForm(null);

    expect(step()).toBe('create');
  });

  it('walks back to a required field that was emptied before submitting', () => {
    useOnboardingStore.setState({ step: 'submit' });
    syncForm(bridge({ values: { ...bridge().values, location: '  ' } }));

    expect(step()).toBe('location');
  });

  it('leaves the submit step alone when everything is filled in', () => {
    useOnboardingStore.setState({ step: 'submit' });
    syncForm(bridge());

    expect(step()).toBe('submit');
  });

  it('jumps to the share step once the event exists', () => {
    useOnboardingStore.setState({ step: 'submit' });
    reportCreated(createdEvent);

    expect(useOnboardingStore.getState()).toMatchObject({
      step: 'share',
      createdEvent,
    });
  });

  it('stops rewinding once the event exists', () => {
    useOnboardingStore.setState({ step: 'submit' });
    reportCreated(createdEvent);
    syncForm(null);

    expect(step()).toBe('share');
  });

  it('keeps the share sheet open after the tour ends', () => {
    useOnboardingStore.setState({ step: 'done', createdEvent });
    end();

    expect(useOnboardingStore.getState()).toMatchObject({
      step: null,
      createdEvent,
    });

    dismissShare();

    expect(useOnboardingStore.getState().createdEvent).toBeNull();
  });
});
