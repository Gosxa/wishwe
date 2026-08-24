// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const markFeedTourSeen = vi.fn(() => Promise.resolve());

vi.mock('@/shared/client_api/user', () => ({
  markFeedTourSeen: () => markFeedTourSeen(),
}));

import type { BackendEvent } from '@/shared/client_api/event';
import type { Profile } from '@/shared/client_api/auth/types';
import {
  useOnboardingStore,
  type OnboardingFormBridge,
  type OnboardingStep,
} from '@/shared/store/useOnboardingStore';
import { useQuickFillStore } from '@/shared/store/useQuickFillStore';
import { useUserStore } from '@/shared/store/useUserStore';
import { FeedTour } from './FeedTour';

const TITLE_TEMPLATE = 'Catch up over coffee or matcha?';

const CASCADE_MS = 495;

const newcomer = {
  id: 7,
  username: 'mila',
  first_name: 'Mila',
  has_seen_feed_tour: false,
} as unknown as Profile;

const anchor = (tourId: string) => {
  const element = document.createElement('div');

  element.dataset.tour = tourId;
  element.getBoundingClientRect = () =>
    ({
      top: 10,
      left: 10,
      right: 90,
      bottom: 40,
      width: 80,
      height: 30,
    }) as DOMRect;
  document.body.append(element);
};

const bridge = (
  overrides: Partial<OnboardingFormBridge> = {},
): OnboardingFormBridge => ({
  isWish: false,
  categories: [
    { id: 1, name: 'Board Games' },
    { id: 2, name: 'Food & Drinks' },
  ],
  selectedCategoryId: null,
  values: { title: '', location: '', description: '', timeframe: '' },
  canSubmit: false,
  chooseType: () => {},
  chooseCategory: () => {},
  fill: vi.fn(),
  ...overrides,
});

const heading = (text: string | RegExp) =>
  screen.queryByRole('heading', { name: text });

describe('FeedTour', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    markFeedTourSeen.mockClear();

    const store = new Map<string, string>();

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
      },
    });

    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('1024'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(0), 16),
    );
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      window.clearTimeout(id);
    });
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      },
    );
    Element.prototype.scrollIntoView = vi.fn();

    useOnboardingStore.setState({ step: null, form: null, createdEvent: null });
    useQuickFillStore.getState().stop();
    useUserStore.setState({ user: newcomer });
    anchor('feed-empty');
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(window, 'localStorage');
    document.body.innerHTML = '';
  });

  const startTour = () => {
    render(<FeedTour />);
    act(() => {
      vi.advanceTimersByTime(200);
    });
  };

  const sync = (overrides: Partial<OnboardingFormBridge> = {}) =>
    act(() => {
      useOnboardingStore.getState().syncForm(bridge(overrides));
    });

  const resumeAt = (
    step: OnboardingStep,
    overrides?: Partial<OnboardingFormBridge>,
  ) => {
    useUserStore.setState({
      user: { ...newcomer, has_seen_feed_tour: true } as Profile,
    });
    useOnboardingStore.setState({ step });

    if (overrides) sync(overrides);

    render(<FeedTour />);
  };

  it('stays away until the feed has rendered', () => {
    document.body.innerHTML = '';
    render(<FeedTour />);

    expect(heading(/^Welcome/)).toBeNull();
  });

  it('greets a first-time visitor once the feed is up', () => {
    startTour();

    expect(heading('Welcome, Mila 👋')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Show me how' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Skip for now' })).toBeTruthy();
  });

  it('leaves a returning visitor alone', () => {
    useUserStore.setState({
      user: { ...newcomer, has_seen_feed_tour: true } as Profile,
    });
    startTour();

    expect(heading(/^Welcome/)).toBeNull();
  });

  it('stays shut at phone width', () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    startTour();

    expect(heading(/^Welcome/)).toBeNull();
  });

  it('marks the tour seen when it is skipped', () => {
    startTour();
    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(useOnboardingStore.getState().step).toBeNull();
    expect(markFeedTourSeen).toHaveBeenCalled();
    expect(useUserStore.getState().user?.has_seen_feed_tour).toBe(true);
  });

  it('points at the create button and waits, offering no next button', () => {
    anchor('create-event');
    startTour();
    fireEvent.click(screen.getByRole('button', { name: 'Show me how' }));

    expect(heading('Great! Tap the +')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Next/ })).toBeNull();
    expect(screen.getByText('Your turn')).toBeTruthy();
  });

  it('walks from the opened modal to wish, then to the category', () => {
    startTour();
    fireEvent.click(screen.getByRole('button', { name: 'Show me how' }));

    sync({ isWish: false });
    expect(heading('Plan or wish? 🤔')).toBeTruthy();

    sync({ isWish: true });
    expect(heading(/Let’s keep it simple/)).toBeTruthy();
    expect(screen.getByText(/food & Drinks/)).toBeTruthy();

    sync({ isWish: true, selectedCategoryId: 2 });
    expect(heading('Name it 📝')).toBeTruthy();
  });

  it('keeps next locked until a required field has something in it', () => {
    resumeAt('title', { isWish: true, selectedCategoryId: 2 });

    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: /Next/ }).disabled,
    ).toBe(true);

    sync({
      isWish: true,
      selectedCategoryId: 2,
      values: {
        title: 'Coffee?',
        location: '',
        description: '',
        timeframe: '',
      },
    });

    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: /Next/ }).disabled,
    ).toBe(false);
  });

  it('fills the field up front, then moves on once the words land', () => {
    const fill = vi.fn();

    resumeAt('title', { isWish: true, selectedCategoryId: 2, fill });

    fireEvent.click(screen.getByRole('button', { name: /Use this/ }));

    expect(fill).toHaveBeenCalledWith('title', TITLE_TEMPLATE);
    expect(useQuickFillStore.getState().tourId).toBe('field-title');
    expect(useOnboardingStore.getState().step).toBe('title');

    act(() => {
      vi.advanceTimersByTime(CASCADE_MS);
    });

    expect(useQuickFillStore.getState().tourId).toBeNull();
    expect(useOnboardingStore.getState().step).toBe('location');
  });

  it('snaps to the end when the template is pressed again mid-cascade', () => {
    const fill = vi.fn();

    resumeAt('title', { isWish: true, selectedCategoryId: 2, fill });

    const useThis = screen.getByRole('button', { name: /Use this/ });

    fireEvent.click(useThis);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.click(useThis);

    expect(fill).toHaveBeenCalledTimes(1);
    expect(useQuickFillStore.getState().tourId).toBeNull();
    expect(useOnboardingStore.getState().step).toBe('location');
  });

  it('does not advance twice when next is pressed mid-cascade', () => {
    resumeAt('title', {
      isWish: true,
      selectedCategoryId: 2,
      values: {
        title: 'Coffee?',
        location: '',
        description: '',
        timeframe: '',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /Use this/ }));
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));

    expect(useOnboardingStore.getState().step).toBe('location');
    expect(useQuickFillStore.getState().tourId).toBeNull();

    act(() => {
      vi.advanceTimersByTime(CASCADE_MS);
    });

    expect(useOnboardingStore.getState().step).toBe('location');
  });

  it('sends the user back to the create button if the modal is closed', () => {
    resumeAt('timeframe', { isWish: true, selectedCategoryId: 2 });

    act(() => {
      useOnboardingStore.getState().syncForm(null);
    });

    expect(heading('Great! Tap the +')).toBeTruthy();
  });

  it('ends on the share sheet and marks the tour seen', () => {
    anchor('share-actions');
    resumeAt('submit');

    act(() => {
      useOnboardingStore.getState().reportCreated({ id: 9 } as BackendEvent);
    });

    expect(heading(/Now bring your people/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
    expect(heading('You’re all set! ✅')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(useOnboardingStore.getState().step).toBeNull();
    expect(markFeedTourSeen).toHaveBeenCalled();
    expect(useOnboardingStore.getState().createdEvent).toEqual({ id: 9 });
  });
});
