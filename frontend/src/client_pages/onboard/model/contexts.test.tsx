// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';

import {
  BackProvider,
  IntroProvider,
  InviteProvider,
  NextPathProvider,
  SCREEN_ID,
  TrackProvider,
  useActiveBackAction,
  useIntroContext,
  useInviteContext,
  useNextPath,
  useRegisterBack,
  useTrackContext,
} from './index';
import type { ScreenId } from './screensConfig';

describe('onboard context layer', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    consoleError.mockRestore();
    vi.restoreAllMocks();
  });

  describe('provider guards', () => {
    it('throws when useTrackContext is used outside TrackProvider', () => {
      const Orphan = () => {
        useTrackContext();

        return null;
      };

      expect(() => render(<Orphan />)).toThrow(
        'useTrackContext must be used within TrackProvider',
      );
    });

    it('throws when useIntroContext is used outside IntroProvider', () => {
      const Orphan = () => {
        useIntroContext();

        return null;
      };

      expect(() => render(<Orphan />)).toThrow(
        'useIntroContext must be used within IntroProvider',
      );
    });

    it('throws when useActiveBackAction is used outside BackProvider', () => {
      const Orphan = () => {
        useActiveBackAction(SCREEN_ID.ENTER_EMAIL);

        return null;
      };

      expect(() => render(<Orphan />)).toThrow(
        'useBackContext must be used within BackProvider',
      );
    });

    it('throws when useRegisterBack is used outside BackProvider', () => {
      const Orphan = () => {
        useRegisterBack(SCREEN_ID.ENTER_EMAIL, {
          label: 'Back to login',
          onBack: () => {},
        });

        return null;
      };

      expect(() => render(<Orphan />)).toThrow(
        'useBackContext must be used within BackProvider',
      );
    });
  });

  describe('InviteProvider / NextPathProvider', () => {
    const InviteProbe = () => {
      const invite = useInviteContext();

      return <span data-testid="invite">{invite?.token ?? 'none'}</span>;
    };

    const NextProbe = () => {
      const next = useNextPath();

      return <span data-testid="next">{next ?? 'none'}</span>;
    };

    it('exposes null outside of the providers', () => {
      render(
        <>
          <InviteProbe />
          <NextProbe />
        </>,
      );

      expect(screen.getByTestId('invite').textContent).toBe('none');
      expect(screen.getByTestId('next').textContent).toBe('none');
    });

    it('normalizes an omitted invite and next path to null', () => {
      render(
        <InviteProvider>
          <NextPathProvider>
            <InviteProbe />
            <NextProbe />
          </NextPathProvider>
        </InviteProvider>,
      );

      expect(screen.getByTestId('invite').textContent).toBe('none');
      expect(screen.getByTestId('next').textContent).toBe('none');
    });

    it('passes the invite and next path down to consumers', () => {
      render(
        <InviteProvider invite={{ token: 'inv-1', username: 'amy' }}>
          <NextPathProvider next="/share/abc">
            <InviteProbe />
            <NextProbe />
          </NextPathProvider>
        </InviteProvider>,
      );

      expect(screen.getByTestId('invite').textContent).toBe('inv-1');
      expect(screen.getByTestId('next').textContent).toBe('/share/abc');
    });
  });

  describe('IntroProvider', () => {
    const IntroProbe = () => {
      const { isStarted, start } = useIntroContext();

      return (
        <button onClick={start}>{isStarted ? 'started' : 'not started'}</button>
      );
    };

    it('starts closed and latches open once start is called', () => {
      render(
        <IntroProvider>
          <IntroProbe />
        </IntroProvider>,
      );

      const button = screen.getByRole('button');

      expect(button.textContent).toBe('not started');

      fireEvent.click(button);
      expect(button.textContent).toBe('started');

      fireEvent.click(button);
      expect(button.textContent).toBe('started');
    });
  });

  describe('TrackProvider', () => {
    const TrackProbe = () => {
      const { screenStack, pointer, next, back, setScreenStack } =
        useTrackContext();

      return (
        <div>
          <span data-testid="stack">{screenStack.join(',')}</span>
          <span data-testid="pointer">{pointer}</span>
          <button onClick={() => next(SCREEN_ID.ENTER_EMAIL)}>to email</button>
          <button onClick={() => next(SCREEN_ID.ENTER_PWD)}>to password</button>
          <button onClick={() => back(0)}>to start</button>
          <button onClick={() => setScreenStack(prev => prev.slice(0, 1))}>
            prune
          </button>
        </div>
      );
    };

    const stack = () => screen.getByTestId('stack').textContent;
    const pointer = () => screen.getByTestId('pointer').textContent;

    beforeEach(() => {
      render(
        <TrackProvider>
          <TrackProbe />
        </TrackProvider>,
      );
    });

    it('opens on the login screen', () => {
      expect(stack()).toBe(String(SCREEN_ID.LOGIN_SCREEN));
      expect(pointer()).toBe('0');
    });

    it('pushes each screen onto the stack and advances the pointer', () => {
      fireEvent.click(screen.getByRole('button', { name: 'to email' }));
      fireEvent.click(screen.getByRole('button', { name: 'to password' }));

      expect(stack()).toBe(
        [
          SCREEN_ID.LOGIN_SCREEN,
          SCREEN_ID.ENTER_EMAIL,
          SCREEN_ID.ENTER_PWD,
        ].join(','),
      );
      expect(pointer()).toBe('2');
    });

    it('keeps abandoned forward screens in the stack when moving back', () => {
      fireEvent.click(screen.getByRole('button', { name: 'to email' }));
      fireEvent.click(screen.getByRole('button', { name: 'to start' }));

      expect(pointer()).toBe('0');
      expect(stack()).toBe(
        [SCREEN_ID.LOGIN_SCREEN, SCREEN_ID.ENTER_EMAIL].join(','),
      );
    });

    it('lets the track prune the stack without touching the pointer', () => {
      fireEvent.click(screen.getByRole('button', { name: 'to email' }));
      fireEvent.click(screen.getByRole('button', { name: 'to start' }));
      fireEvent.click(screen.getByRole('button', { name: 'prune' }));

      expect(stack()).toBe(String(SCREEN_ID.LOGIN_SCREEN));
      expect(pointer()).toBe('0');
    });
  });

  describe('BackProvider', () => {
    type ScreenProbeProps = {
      id: ScreenId;
      label: string;
      onBack: () => void;
    };

    const ScreenProbe = ({ id, label, onBack }: ScreenProbeProps) => {
      useRegisterBack(id, { label, onBack });

      return null;
    };

    const Overlay = ({ active }: { active: ScreenId | undefined }) => {
      const action = useActiveBackAction(active);

      return action ? (
        <button aria-label={action.label} onClick={action.onBack} />
      ) : (
        <span data-testid="no-back" />
      );
    };

    it('exposes no action for an unregistered or undefined screen', () => {
      render(
        <BackProvider>
          <Overlay active={undefined} />
        </BackProvider>,
      );

      expect(screen.getByTestId('no-back')).toBeTruthy();

      cleanup();

      render(
        <BackProvider>
          <Overlay active={SCREEN_ID.ENTER_EMAIL} />
        </BackProvider>,
      );

      expect(screen.getByTestId('no-back')).toBeTruthy();
    });

    it('surfaces only the action registered for the active screen', () => {
      const onEmailBack = vi.fn();
      const onVerifyBack = vi.fn();

      const Harness = ({ active }: { active: ScreenId }) => (
        <BackProvider>
          <ScreenProbe
            id={SCREEN_ID.ENTER_EMAIL}
            label="Back to login"
            onBack={onEmailBack}
          />
          <ScreenProbe
            id={SCREEN_ID.VERIFY_REGISTER}
            label="Change email"
            onBack={onVerifyBack}
          />
          <Overlay active={active} />
        </BackProvider>
      );

      const { rerender } = render(<Harness active={SCREEN_ID.ENTER_EMAIL} />);

      fireEvent.click(screen.getByRole('button', { name: 'Back to login' }));
      expect(onEmailBack).toHaveBeenCalledTimes(1);
      expect(onVerifyBack).not.toHaveBeenCalled();

      rerender(<Harness active={SCREEN_ID.VERIFY_REGISTER} />);

      fireEvent.click(screen.getByRole('button', { name: 'Change email' }));
      expect(onVerifyBack).toHaveBeenCalledTimes(1);
      expect(onEmailBack).toHaveBeenCalledTimes(1);
    });

    it('republishes the action when only the label changes', () => {
      const Harness = () => {
        const [label, setLabel] = useState('Go back');

        return (
          <BackProvider>
            <ScreenProbe
              id={SCREEN_ID.VERIFY_RESET}
              label={label}
              onBack={() => {}}
            />
            <Overlay active={SCREEN_ID.VERIFY_RESET} />
            <button onClick={() => setLabel('Change email')}>relabel</button>
          </BackProvider>
        );
      };

      render(<Harness />);

      expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy();

      fireEvent.click(screen.getByRole('button', { name: 'relabel' }));

      expect(screen.getByRole('button', { name: 'Change email' })).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Go back' })).toBeNull();
    });

    it('calls the latest callback even when the label is unchanged', () => {
      const first = vi.fn();
      const second = vi.fn();

      const Harness = () => {
        const [handler, setHandler] = useState(() => first);

        return (
          <BackProvider>
            <ScreenProbe
              id={SCREEN_ID.ENTER_EMAIL}
              label="Back to login"
              onBack={handler}
            />
            <Overlay active={SCREEN_ID.ENTER_EMAIL} />
            <button onClick={() => setHandler(() => second)}>swap</button>
          </BackProvider>
        );
      };

      render(<Harness />);

      fireEvent.click(screen.getByRole('button', { name: 'swap' }));
      fireEvent.click(screen.getByRole('button', { name: 'Back to login' }));

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });

    it('unregisters the action when the screen unmounts', () => {
      const Harness = ({ mounted }: { mounted: boolean }) => (
        <BackProvider>
          {mounted && (
            <ScreenProbe
              id={SCREEN_ID.ENTER_EMAIL}
              label="Back to login"
              onBack={() => {}}
            />
          )}
          <Overlay active={SCREEN_ID.ENTER_EMAIL} />
        </BackProvider>
      );

      const { rerender } = render(<Harness mounted />);

      expect(
        screen.getByRole('button', { name: 'Back to login' }),
      ).toBeTruthy();

      act(() => {
        rerender(<Harness mounted={false} />);
      });

      expect(
        screen.queryByRole('button', { name: 'Back to login' }),
      ).toBeNull();
      expect(screen.getByTestId('no-back')).toBeTruthy();
    });
  });
});
