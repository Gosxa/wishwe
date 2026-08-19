// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import {
  BackProvider,
  IntroProvider,
  InviteProvider,
  NextPathProvider,
  SCREEN_ID,
  TrackProvider,
  useTrackContext,
} from '../../model';
import type { InviteContext } from '../../model/screensConfig';
import { Track } from './Track';

const VIEWPORT_PADDING = 8;

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];

  observed: Element[] = [];

  disconnected = false;

  constructor(private readonly callback: () => void) {
    MockResizeObserver.instances.push(this);
  }

  observe(element: Element) {
    this.observed.push(element);
  }

  unobserve() {}

  disconnect() {
    this.disconnected = true;
  }

  trigger() {
    this.callback();
  }
}

const latestObserver = () =>
  MockResizeObserver.instances[MockResizeObserver.instances.length - 1];

const Controls = () => {
  const { next, back } = useTrackContext();

  return (
    <div>
      <button onClick={() => next(SCREEN_ID.ENTER_EMAIL)}>go email</button>
      <button onClick={() => next(SCREEN_ID.ENTER_PWD)}>go password</button>
      <button onClick={() => back(0)}>go start</button>
      <button onClick={() => back(1)}>go second</button>
    </div>
  );
};

type HarnessProps = {
  invite?: InviteContext;
};

const Harness = ({ invite }: HarnessProps) => (
  <TrackProvider>
    <InviteProvider invite={invite}>
      <NextPathProvider>
        <IntroProvider>
          <BackProvider>
            <Controls />
            <Track invite={invite} />
          </BackProvider>
        </IntroProvider>
      </NextPathProvider>
    </InviteProvider>
  </TrackProvider>
);

const inner = () =>
  document.querySelector('[style*="--pointer"]') as HTMLElement;

const trackEl = () =>
  inner().firstElementChild!.firstElementChild as HTMLElement;

const screenEls = () => Array.from(trackEl().children) as HTMLElement[];

const cssVar = (name: string) => inner().style.getPropertyValue(name);

const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }));

describe('Track', () => {
  let activeHeight: number;

  beforeEach(() => {
    MockResizeObserver.instances = [];
    activeHeight = 240;

    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false })),
    );

    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => ({ height: activeHeight }) as DOMRect,
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('rendering the stack', () => {
    it('renders only the screens currently on the stack', () => {
      render(<Harness />);

      expect(screenEls()).toHaveLength(1);
      expect(screen.getByText('Get together, finally')).toBeTruthy();
      expect(screen.queryByText('Enter your email')).toBeNull();
      expect(cssVar('--pointer')).toBe('0');
    });

    it('renders the pushed screen and moves the pointer variable', () => {
      render(<Harness />);

      click('go email');

      expect(screenEls()).toHaveLength(2);
      expect(screen.getByText('Enter your email')).toBeTruthy();
      expect(cssVar('--pointer')).toBe('1');
    });

    it('keeps the screens in stack order', () => {
      render(<Harness />);

      click('go email');
      click('go password');

      const headings = screenEls().map(
        el => el.querySelector('h2')?.textContent,
      );

      expect(headings).toEqual([
        'Get together, finally',
        'Enter your email',
        'Enter your password',
      ]);
      expect(cssVar('--pointer')).toBe('2');
    });

    it('passes the invite down to the first screen', () => {
      render(<Harness invite={{ token: 'inv-1', username: 'amy' }} />);

      expect(screen.getByText('Join @amy on wish.we')).toBeTruthy();
    });
  });

  describe('active screen measurement', () => {
    it('publishes the active screen height plus the viewport padding', () => {
      render(<Harness />);

      expect(cssVar('--viewport-height')).toBe(
        `${activeHeight + VIEWPORT_PADDING}px`,
      );
    });

    it('rounds a fractional height up', () => {
      activeHeight = 240.2;
      render(<Harness />);

      expect(cssVar('--viewport-height')).toBe(`${241 + VIEWPORT_PADDING}px`);
    });

    it('observes the active screen', () => {
      render(<Harness />);

      expect(latestObserver().observed).toEqual([screenEls()[0]]);

      click('go email');

      expect(latestObserver().observed).toEqual([screenEls()[1]]);
    });

    it('re-measures when the observer reports a resize', () => {
      render(<Harness />);

      activeHeight = 320;
      act(() => latestObserver().trigger());

      expect(cssVar('--viewport-height')).toBe(`${320 + VIEWPORT_PADDING}px`);
    });

    it('disconnects the previous observer when the active screen changes', () => {
      render(<Harness />);

      const first = latestObserver();

      click('go email');

      expect(first.disconnected).toBe(true);
      expect(latestObserver()).not.toBe(first);
      expect(latestObserver().disconnected).toBe(false);
    });

    it('disconnects the observer on unmount', () => {
      const { unmount } = render(<Harness />);
      const observer = latestObserver();

      unmount();

      expect(observer.disconnected).toBe(true);
    });
  });

  describe('pruning abandoned forward screens', () => {
    const goForwardThenBack = () => {
      click('go email');
      click('go password');
      click('go second');
    };

    it('drops screens ahead of the pointer once the slide finishes', () => {
      render(<Harness />);

      goForwardThenBack();

      expect(screenEls()).toHaveLength(3);

      fireEvent.transitionEnd(trackEl(), { propertyName: 'transform' });

      expect(screenEls()).toHaveLength(2);
      expect(screen.queryByText('Enter your password')).toBeNull();
      expect(screen.getByText('Enter your email')).toBeTruthy();
    });

    it('ignores transitions of other properties', () => {
      render(<Harness />);

      goForwardThenBack();
      fireEvent.transitionEnd(trackEl(), { propertyName: 'height' });

      expect(screenEls()).toHaveLength(3);
      expect(screen.getByText('Enter your password')).toBeTruthy();
    });

    it('ignores transitions bubbling up from a screen', () => {
      render(<Harness />);

      goForwardThenBack();
      fireEvent.transitionEnd(screenEls()[0], {
        propertyName: 'transform',
        bubbles: true,
      });

      expect(screenEls()).toHaveLength(3);
      expect(screen.getByText('Enter your password')).toBeTruthy();
    });

    it('leaves a stack that is already trimmed untouched', () => {
      render(<Harness />);

      click('go email');
      fireEvent.transitionEnd(trackEl(), { propertyName: 'transform' });

      expect(screenEls()).toHaveLength(2);
      expect(cssVar('--pointer')).toBe('1');
    });

    it('re-uses the pruned stack when moving forward again', () => {
      render(<Harness />);

      goForwardThenBack();
      fireEvent.transitionEnd(trackEl(), { propertyName: 'transform' });

      click('go start');
      fireEvent.transitionEnd(trackEl(), { propertyName: 'transform' });

      expect(screenEls()).toHaveLength(1);
      expect(cssVar('--pointer')).toBe('0');
      expect(screen.getByText('Get together, finally')).toBeTruthy();
    });
  });
});
