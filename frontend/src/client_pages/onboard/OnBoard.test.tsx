// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  checkEmail: vi.fn(),
  verifyCode: vi.fn(),
  login: vi.fn(),
  loginWithGoogle: vi.fn(),
  register: vi.fn(),
  resetPassword: vi.fn(),
  setNewPassword: vi.fn(),
}));

const userMocks = vi.hoisted(() => ({
  acceptInvite: vi.fn(),
  checkUsername: vi.fn(),
  onBoard: vi.fn(),
  changeAvatar: vi.fn(),
}));

const routerMocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('@/shared/client_api/auth', () => authMocks);

vi.mock('@/shared/client_api/user', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/shared/client_api/user')>();

  return { ...actual, ...userMocks };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerMocks.push }),
}));

import { AcceptInviteError } from '@/shared/client_api/user';
import type { Profile } from '@/shared/client_api/auth/types';
import { useLoadingStore } from '@/shared/store/useLoadingStore';
import { useUserStore } from '@/shared/store/useUserStore';
import { useOnboardDataStore } from './model';
import { OnBoard } from './OnBoard';

const EMAIL = 'amy@example.com';
const CODE = '123456';
const PASSWORD = 'sup3rsecret';

const profile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 7,
  user: EMAIL,
  user_id: 7,
  username: 'amy',
  first_name: 'Amy',
  last_name: 'Lee',
  bio: null,
  date_of_birth: null,
  city: null,
  gender: null,
  avatar: null,
  social_media_url: null,
  is_private: false,
  has_seen_feed_tour: false,
  ...overrides,
});

class MockResizeObserver {
  observe() {}

  unobserve() {}

  disconnect() {}
}

const activeScreen = () => {
  const inner = document.querySelector('[style*="--pointer"]') as HTMLElement;
  const pointer = Number(inner.style.getPropertyValue('--pointer'));
  const track = inner.firstElementChild!.firstElementChild!;

  return track.children[pointer] as HTMLElement;
};

const ui = () => within(activeScreen());

const layout = () => document.querySelector('main') as HTMLElement;

const backOverlayButton = () =>
  document.querySelector(
    'main > div > button[aria-label]',
  ) as HTMLButtonElement | null;

const otpCells = () =>
  Array.from(
    activeScreen().querySelectorAll('input[autocomplete="one-time-code"]'),
  ) as HTMLInputElement[];

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const clickButton = async (name: string | RegExp) => {
  await act(async () => {
    fireEvent.click(ui().getByRole('button', { name }));
  });
  await flush();
};

const typeInto = (element: HTMLElement, value: string) =>
  fireEvent.change(element, { target: { value } });

describe('OnBoard', () => {
  let isCompact: boolean;
  let popup: { closed: boolean };
  let openSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    isCompact = false;
    popup = { closed: false };
    openSpy = vi.fn(() => popup);

    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: isCompact })),
    );
    vi.stubGlobal('open', openSpy);

    useOnboardDataStore.getState().reset();
    useUserStore.setState({ user: null });
    useLoadingStore.setState({ isLoading: false });

    authMocks.checkEmail.mockResolvedValue({ flow: 'register' });
    authMocks.verifyCode.mockResolvedValue({ verification_token: 'vt-1' });
    authMocks.login.mockResolvedValue(profile());
    authMocks.loginWithGoogle.mockResolvedValue(profile());
    authMocks.register.mockResolvedValue(profile());
    authMocks.resetPassword.mockResolvedValue(undefined);
    authMocks.setNewPassword.mockResolvedValue(undefined);

    userMocks.acceptInvite.mockResolvedValue(undefined);
    userMocks.checkUsername.mockResolvedValue({ available: true });
    userMocks.onBoard.mockResolvedValue(undefined);
    userMocks.changeAvatar.mockResolvedValue({ avatar: '/media/a.png' });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const renderOnBoard = (props: Parameters<typeof OnBoard>[0] = {}) =>
    render(<OnBoard {...props} />);

  const postGoogleMessage = async (data: unknown) => {
    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', { data, origin: window.location.origin }),
      );
    });
    await flush();
  };

  const startGoogle = async () => {
    await clickButton(/Get started/);
  };

  const goToEmailScreen = async () => {
    await clickButton('Continue with email');
  };

  const submitEmail = async (email = EMAIL) => {
    typeInto(ui().getByPlaceholderText('mail@example.com'), email);
    await clickButton('Continue');
  };

  const fillCode = async (code = CODE) => {
    const cells = otpCells();

    await act(async () => {
      code.split('').forEach((digit, i) => {
        fireEvent.change(cells[i], { target: { value: digit } });
      });
    });
  };

  const goToVerifyRegister = async () => {
    await goToEmailScreen();
    await submitEmail();
  };

  const goToCreatePassword = async () => {
    await goToVerifyRegister();
    await fillCode();
    await clickButton('Verify code');
  };

  const goToPersonalData = async () => {
    await goToCreatePassword();
    typeInto(ui().getByPlaceholderText('At least 8 characters'), PASSWORD);
    fireEvent.blur(ui().getByPlaceholderText('At least 8 characters'));
    await clickButton('Set password');
  };

  describe('first screen', () => {
    it('renders the default sign-in options collapsed', () => {
      renderOnBoard();

      expect(ui().getByText('Get together, finally')).toBeTruthy();
      expect(
        ui().getByText(
          'No random people. No noise. Just you and your inner circle',
        ),
      ).toBeTruthy();
      expect(ui().getByRole('button', { name: /Get started/ })).toBeTruthy();
      expect(
        ui().getByRole('button', { name: 'Continue with email' }),
      ).toBeTruthy();
      expect(
        ui().queryByRole('link', { name: 'Join without invite' }),
      ).toBeNull();
      expect(layout().dataset.authExpanded).toBe('false');
    });

    it('renders invite copy and an escape hatch for the sender', () => {
      renderOnBoard({ invite: { token: 'inv-1', username: 'amy' } });

      expect(ui().getByText('Join @amy on wish.we')).toBeTruthy();
      expect(
        ui().getByRole('link', { name: 'Join without invite' }),
      ).toHaveProperty('href', expect.stringContaining('/onboard'));
    });

    it('falls back to a placeholder handle when the sender is unknown', () => {
      renderOnBoard({ invite: { token: 'inv-1' } });

      expect(ui().getByText('Join [@username] on wish.we')).toBeTruthy();
    });

    it('strips a leading @ from the sender handle', () => {
      renderOnBoard({ invite: { token: 'inv-1', username: '@amy' } });

      expect(ui().getByText('Join @amy on wish.we')).toBeTruthy();
    });
  });

  describe('intro expansion', () => {
    it('starts Google auth straight away on desktop', async () => {
      renderOnBoard();

      await startGoogle();

      expect(openSpy).toHaveBeenCalledTimes(1);
      expect(String(openSpy.mock.calls[0][0])).toContain(
        'accounts.google.com/o/oauth2/v2/auth',
      );
      expect(layout().dataset.authExpanded).toBe('false');

      await postGoogleMessage({ type: 'google-error', error: 'closed' });
    });

    it('expands the intro sheet first on compact viewports', async () => {
      isCompact = true;
      renderOnBoard();

      await startGoogle();

      expect(openSpy).not.toHaveBeenCalled();
      expect(layout().dataset.authExpanded).toBe('true');

      await startGoogle();

      expect(openSpy).toHaveBeenCalledTimes(1);

      await postGoogleMessage({ type: 'google-error', error: 'closed' });
    });

    it('surfaces a Google failure on the first screen', async () => {
      renderOnBoard();

      await startGoogle();
      await postGoogleMessage({ type: 'google-error', error: 'access_denied' });

      expect(ui().getByText('Service temporarily unavailable')).toBeTruthy();
    });

    it('stays silent when the user closes the Google popup', async () => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
      renderOnBoard();

      await startGoogle();

      popup.closed = true;
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      await flush();

      expect(ui().queryByText('Service temporarily unavailable')).toBeNull();
    });

    it('ignores messages from another origin', async () => {
      renderOnBoard();

      await startGoogle();
      await act(async () => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: { type: 'google-id-token', token: 'tok' },
            origin: 'https://evil.example',
          }),
        );
      });
      await flush();

      expect(authMocks.loginWithGoogle).not.toHaveBeenCalled();

      await postGoogleMessage({ type: 'google-error', error: 'closed' });
    });
  });

  describe('google stack', () => {
    const completeGoogle = async (user: Profile) => {
      authMocks.loginWithGoogle.mockResolvedValue(user);
      await startGoogle();
      await postGoogleMessage({ type: 'google-id-token', token: 'tok' });
    };

    it('sends a brand new Google user to the profile screen prefilled', async () => {
      renderOnBoard();

      await completeGoogle(
        profile({ username: '', first_name: 'Amy', last_name: 'Lee' }),
      );

      expect(authMocks.loginWithGoogle).toHaveBeenCalledWith('tok');
      expect(ui().getByText('Is this you?')).toBeTruthy();
      expect(
        (ui().getByLabelText('First Name') as HTMLInputElement).value,
      ).toBe('Amy');
      expect((ui().getByLabelText('Last Name') as HTMLInputElement).value).toBe(
        'Lee',
      );
    });

    it('sends an existing Google user to the return path', async () => {
      renderOnBoard({ next: '/share/abc' });

      await completeGoogle(profile({ username: 'amy' }));

      expect(routerMocks.push).toHaveBeenCalledWith('/share/abc');
    });

    it('consumes the invite for an existing Google user', async () => {
      renderOnBoard({ invite: { token: 'inv-1', username: 'sam' } });

      await completeGoogle(profile({ username: 'amy' }));

      expect(userMocks.acceptInvite).toHaveBeenCalledWith('inv-1');
      expect(ui().getByText('Request sent!')).toBeTruthy();
    });

    it('reports an invite that could not be accepted', async () => {
      userMocks.acceptInvite.mockRejectedValue(new AcceptInviteError({}));
      renderOnBoard({ invite: { token: 'inv-1', username: 'sam' } });

      await completeGoogle(profile({ username: 'amy' }));

      expect(
        ui().getByText('Unable to accept invite. Please try again.'),
      ).toBeTruthy();
    });

    it('uses invite copy for a new Google user joining a circle', async () => {
      renderOnBoard({ invite: { token: 'inv-1', username: 'sam' } });

      await completeGoogle(profile({ username: '' }));

      expect(ui().getByText('Complete your profile')).toBeTruthy();
      expect(ui().getByText(/We've pulled your info from Google/)).toBeTruthy();
    });
  });

  describe('email screen', () => {
    it('opens the email screen with a back action', async () => {
      renderOnBoard();

      await goToEmailScreen();

      expect(ui().getByText('Enter your email')).toBeTruthy();
      expect(backOverlayButton()?.getAttribute('aria-label')).toBe(
        'Back to login',
      );
      expect(layout().dataset.authExpanded).toBe('true');
    });

    it('uses invite copy on the email screen', async () => {
      renderOnBoard({ invite: { token: 'inv-1', username: 'sam' } });

      await goToEmailScreen();

      expect(
        ui().getByText('Enter your email to join @sam on wish.we.'),
      ).toBeTruthy();
    });

    it('rejects an invalid address without calling the API', async () => {
      renderOnBoard();

      await goToEmailScreen();
      typeInto(ui().getByPlaceholderText('mail@example.com'), 'not-an-email');
      fireEvent.blur(ui().getByPlaceholderText('mail@example.com'));

      expect(ui().getByText('please, enter valid email')).toBeTruthy();

      await clickButton('Continue');

      expect(authMocks.checkEmail).not.toHaveBeenCalled();
      expect(ui().getByText('Enter your email')).toBeTruthy();
    });

    it('reports an unavailable service', async () => {
      authMocks.checkEmail.mockRejectedValue(new Error('Failed'));
      renderOnBoard();

      await goToEmailScreen();
      await submitEmail();

      expect(ui().getByText('Service temporarily unavailable')).toBeTruthy();
    });

    it('shows the loading overlay while the check is in flight', async () => {
      let release: () => void = () => {};

      authMocks.checkEmail.mockReturnValue(
        new Promise(resolve => {
          release = () => resolve({ flow: 'register' });
        }),
      );
      renderOnBoard();

      await goToEmailScreen();
      typeInto(ui().getByPlaceholderText('mail@example.com'), EMAIL);
      await clickButton('Continue');

      expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy();

      await act(async () => {
        release();
      });
      await flush();

      expect(screen.queryByRole('status', { name: 'Loading' })).toBeNull();
    });
  });

  describe('register stack', () => {
    it('routes an unknown address to the verification screen', async () => {
      renderOnBoard();

      await goToVerifyRegister();

      expect(authMocks.checkEmail).toHaveBeenCalledWith(EMAIL);
      expect(ui().getByText('Check your email')).toBeTruthy();
      expect(
        ui().getByText(`Enter the 6-digit code we sent to ${EMAIL}`),
      ).toBeTruthy();
      expect(backOverlayButton()?.getAttribute('aria-label')).toBe(
        'Change email',
      );
    });

    it('moves focus across the code cells as digits are typed', async () => {
      renderOnBoard();

      await goToVerifyRegister();

      const cells = otpCells();

      expect(cells).toHaveLength(6);

      await act(async () => {
        fireEvent.change(cells[0], { target: { value: '1' } });
      });

      expect(cells[0].value).toBe('1');
      expect(document.activeElement).toBe(cells[1]);
    });

    it('spreads a pasted code across every cell', async () => {
      renderOnBoard();

      await goToVerifyRegister();

      const cells = otpCells();

      await act(async () => {
        fireEvent.paste(cells[0], {
          clipboardData: { getData: () => '12 34 56' },
        });
      });

      expect(cells.map(cell => cell.value)).toEqual([
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
      ]);
      expect(document.activeElement).toBe(cells[5]);
    });

    it('does not submit an incomplete code', async () => {
      renderOnBoard();

      await goToVerifyRegister();
      await fillCode('123');
      await clickButton('Verify code');

      expect(authMocks.verifyCode).not.toHaveBeenCalled();
    });

    it('marks the cells and shows the reason when the code is rejected', async () => {
      authMocks.verifyCode.mockRejectedValue(new Error('Invalid code'));
      renderOnBoard();

      await goToVerifyRegister();
      await fillCode();
      await clickButton('Verify code');

      expect(ui().getByText('Invalid code')).toBeTruthy();
      expect(otpCells().every(cell => cell.dataset.error === 'true')).toBe(
        true,
      );

      await act(async () => {
        fireEvent.change(otpCells()[0], { target: { value: '9' } });
      });

      expect(ui().queryByText('Invalid code')).toBeNull();
    });

    it('exchanges a valid code for the password screen', async () => {
      renderOnBoard();

      await goToCreatePassword();

      expect(authMocks.verifyCode).toHaveBeenCalledWith(EMAIL, CODE);
      expect(ui().getByText('Create a password')).toBeTruthy();
      expect(ui().queryByPlaceholderText('Password')).toBeNull();
    });

    it('counts down before offering a resend', async () => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
      renderOnBoard();

      await goToVerifyRegister();

      expect(ui().getByText(/Resend in 1:00/)).toBeTruthy();
      expect(
        ui().queryByRole('button', { name: 'Re-send password' }),
      ).toBeNull();

      await act(async () => {
        vi.advanceTimersByTime(60_000);
      });

      expect(
        ui().getByRole('button', { name: 'Re-send password' }),
      ).toBeTruthy();

      authMocks.checkEmail.mockClear();
      await clickButton('Re-send password');

      expect(authMocks.checkEmail).toHaveBeenCalledWith(EMAIL);
      expect(ui().getByText(/Resend in 1:00/)).toBeTruthy();
    });

    it('reports a failed resend', async () => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
      renderOnBoard();

      await goToVerifyRegister();
      await act(async () => {
        vi.advanceTimersByTime(60_000);
      });

      authMocks.checkEmail.mockRejectedValue(new Error('Failed'));
      await clickButton('Re-send password');

      expect(ui().getByText('Service temporarily unavailable')).toBeTruthy();
    });

    it('blocks a weak password and accepts a strong one', async () => {
      renderOnBoard();

      await goToCreatePassword();

      const input = ui().getByPlaceholderText('At least 8 characters');

      typeInto(input, 'short');
      fireEvent.blur(input);

      expect(
        ui().getByText('Minimum 8 characters with letters and numbers'),
      ).toBeTruthy();

      await clickButton('Set password');

      expect(ui().getByText('Create a password')).toBeTruthy();

      typeInto(input, PASSWORD);
      fireEvent.blur(input);
      await clickButton('Set password');

      expect(ui().getByText('Complete your profile')).toBeTruthy();
    });

    it('keeps the submit disabled until terms and a nickname are given', async () => {
      renderOnBoard();

      await goToPersonalData();

      const submit = ui().getByRole('button', {
        name: "Let's go",
      }) as HTMLButtonElement;

      expect(submit.disabled).toBe(true);

      typeInto(ui().getByLabelText(/Your nickname/), 'amy');

      expect(submit.disabled).toBe(true);

      fireEvent.click(ui().getByLabelText('I agree to the'));

      expect(submit.disabled).toBe(false);
    });

    it('rejects a nickname that is already taken', async () => {
      userMocks.checkUsername.mockResolvedValue({ available: false });
      renderOnBoard();

      await goToPersonalData();
      typeInto(ui().getByLabelText(/Your nickname/), 'amy');
      await act(async () => {
        fireEvent.blur(ui().getByLabelText(/Your nickname/));
      });
      await flush();

      expect(
        ui().getByText('Nickname is already taken. Please, choose another one'),
      ).toBeTruthy();
    });

    it('registers the account and lands on the done screen', async () => {
      renderOnBoard();

      await goToPersonalData();
      typeInto(ui().getByLabelText(/Your nickname/), 'amy');
      typeInto(ui().getByLabelText('First Name'), 'Amy');
      typeInto(ui().getByLabelText('Last Name'), 'Lee');
      fireEvent.click(ui().getByLabelText('I agree to the'));
      await clickButton("Let's go");

      expect(authMocks.register).toHaveBeenCalledWith({
        token: 'vt-1',
        password: PASSWORD,
        username: 'amy',
        firstName: 'Amy',
        lastName: 'Lee',
      });
      expect(useUserStore.getState().user?.username).toBe('amy');
      expect(ui().getByText(/Welcome aboard/)).toBeTruthy();
      expect(ui().getByRole('link', { name: 'To feed' })).toHaveProperty(
        'href',
        expect.stringContaining('/feed'),
      );
    });

    it('lowercases the nickname as it is typed', async () => {
      renderOnBoard();

      await goToPersonalData();
      typeInto(ui().getByLabelText(/Your nickname/), 'AmY');

      expect(
        (ui().getByLabelText(/Your nickname/) as HTMLInputElement).value,
      ).toBe('amy');
    });

    it('consumes the invite instead of the done screen', async () => {
      renderOnBoard({ invite: { token: 'inv-1', username: 'sam' } });

      await goToPersonalData();
      typeInto(ui().getByLabelText(/Your nickname/), 'amy');
      fireEvent.click(ui().getByLabelText('I agree to the'));
      await clickButton("Let's go");

      expect(userMocks.acceptInvite).toHaveBeenCalledWith('inv-1');
      expect(ui().getByText('Request sent!')).toBeTruthy();
    });
  });

  describe('login stack', () => {
    const goToPasswordScreen = async (
      props: Parameters<typeof OnBoard>[0] = {},
    ) => {
      authMocks.checkEmail.mockResolvedValue({ flow: 'login' });
      renderOnBoard(props);
      await goToEmailScreen();
      await submitEmail();
    };

    const passwordField = () =>
      ui().getByPlaceholderText('Password') as HTMLInputElement;

    it('routes a known address to the password screen', async () => {
      await goToPasswordScreen();

      expect(ui().getByText('Enter your password')).toBeTruthy();
      expect(ui().getByRole('button', { name: 'Log in' })).toBeTruthy();
    });

    it('keeps the user on the screen when the password is wrong', async () => {
      authMocks.login.mockRejectedValue(new Error('Auth failed'));
      await goToPasswordScreen();

      typeInto(passwordField(), 'wrong-password');
      await clickButton('Log in');

      expect(ui().getByText('Login failed')).toBeTruthy();
      expect(routerMocks.push).not.toHaveBeenCalled();

      typeInto(passwordField(), 'wrong-password2');

      expect(ui().queryByText('Login failed')).toBeNull();
    });

    it('navigates to the return path after a successful login', async () => {
      await goToPasswordScreen({ next: '/share/abc' });

      typeInto(passwordField(), PASSWORD);
      await clickButton('Log in');

      expect(authMocks.login).toHaveBeenCalledWith(EMAIL, PASSWORD);
      expect(routerMocks.push).toHaveBeenCalledWith('/share/abc');
    });

    it('falls back to the home page without a return path', async () => {
      await goToPasswordScreen();

      typeInto(passwordField(), PASSWORD);
      await clickButton('Log in');

      expect(routerMocks.push).toHaveBeenCalledWith('/');
    });

    it('accepts the invite instead of navigating away', async () => {
      await goToPasswordScreen({ invite: { token: 'inv-1', username: 'sam' } });

      expect(
        ui().getByText('Log in to your account to connect with @sam'),
      ).toBeTruthy();

      typeInto(passwordField(), PASSWORD);
      await clickButton('Log in & join');

      expect(userMocks.acceptInvite).toHaveBeenCalledWith('inv-1');
      expect(routerMocks.push).not.toHaveBeenCalled();
      expect(ui().getByText('Request sent!')).toBeTruthy();
    });

    it('reports an invite that could not be accepted', async () => {
      userMocks.acceptInvite.mockRejectedValue(new AcceptInviteError({}));
      await goToPasswordScreen({ invite: { token: 'inv-1', username: 'sam' } });

      typeInto(passwordField(), PASSWORD);
      await clickButton('Log in & join');

      expect(
        ui().getByText('Unable to accept invite. Please try again.'),
      ).toBeTruthy();
    });
  });

  describe('reset stack', () => {
    const goToResetVerify = async (
      props: Parameters<typeof OnBoard>[0] = {},
    ) => {
      authMocks.checkEmail.mockResolvedValue({ flow: 'login' });
      renderOnBoard(props);
      await goToEmailScreen();
      await submitEmail();
      typeInto(ui().getByPlaceholderText('Password'), 'old-password');
      await clickButton('Forgot Password?');
    };

    const goToResetPassword = async (
      props: Parameters<typeof OnBoard>[0] = {},
    ) => {
      await goToResetVerify(props);
      await fillCode();
      await clickButton('Verify code');
    };

    const fillNewPassword = (password = PASSWORD, confirm = PASSWORD) => {
      const passwordInput = ui().getByPlaceholderText('At least 8 characters');
      const confirmInput = ui().getByPlaceholderText('Password');

      typeInto(passwordInput, password);
      fireEvent.blur(passwordInput);
      typeInto(confirmInput, confirm);
      fireEvent.blur(confirmInput);
    };

    const submitNewPassword = async (
      password = PASSWORD,
      confirm = PASSWORD,
    ) => {
      fillNewPassword(password, confirm);
      await clickButton('Update password');
    };

    it('sends a reset code and offers a different back action', async () => {
      await goToResetVerify();

      expect(authMocks.resetPassword).toHaveBeenCalledWith(EMAIL);
      expect(ui().getByText('Check your email')).toBeTruthy();
      expect(backOverlayButton()?.getAttribute('aria-label')).toBe('Go back');
    });

    it('reports a failed reset request', async () => {
      authMocks.resetPassword.mockRejectedValue(new Error('Reset failed'));
      await goToResetVerify();

      expect(ui().getByText('Service temporarily unavailable')).toBeTruthy();
      expect(ui().getByText('Enter your password')).toBeTruthy();
    });

    it('requires the confirmation to match before updating', async () => {
      await goToResetPassword();

      expect(ui().getByText('Create new password')).toBeTruthy();

      fillNewPassword(PASSWORD, 'something-else');

      expect(ui().getByText("Passwords don't match")).toBeTruthy();

      await clickButton('Update password');

      expect(authMocks.setNewPassword).not.toHaveBeenCalled();
    });

    it('updates the password, signs in, and honours the return path', async () => {
      await goToResetPassword({ next: '/share/abc' });
      await submitNewPassword();

      expect(authMocks.setNewPassword).toHaveBeenCalledWith('vt-1', PASSWORD);
      expect(authMocks.login).toHaveBeenCalledWith(EMAIL, PASSWORD);
      expect(ui().getByText('Congrats')).toBeTruthy();
      expect(ui().getByText('Password updated successfully')).toBeTruthy();
      expect(ui().getByRole('link', { name: 'Continue' })).toHaveProperty(
        'href',
        expect.stringContaining('/share/abc'),
      );
    });

    it('reports a failed password update', async () => {
      authMocks.setNewPassword.mockRejectedValue(new Error('Failed'));
      await goToResetPassword();
      await submitNewPassword();

      expect(ui().getByText('Service temporarily unavailable')).toBeTruthy();
    });
  });

  describe('back navigation', () => {
    const clickBackOverlay = async () => {
      await act(async () => {
        fireEvent.click(backOverlayButton()!);
      });
      await flush();
    };

    it('offers no back action on the first screen', () => {
      renderOnBoard();

      expect(backOverlayButton()).toBeNull();
    });

    it('returns to the first screen and collapses the sheet', async () => {
      renderOnBoard();

      await goToEmailScreen();
      await clickBackOverlay();

      expect(ui().getByText('Get together, finally')).toBeTruthy();
      expect(backOverlayButton()).toBeNull();
      expect(layout().dataset.authExpanded).toBe('false');
    });

    it('clears the email when leaving the register verification', async () => {
      renderOnBoard();

      await goToVerifyRegister();
      await clickBackOverlay();

      expect(ui().getByText('Enter your email')).toBeTruthy();
      expect(
        (ui().getByPlaceholderText('mail@example.com') as HTMLInputElement)
          .value,
      ).toBe('');
    });

    it('drops the abandoned screens and their back action after the slide', async () => {
      renderOnBoard();

      await goToVerifyRegister();
      await clickBackOverlay();

      const track = activeScreen().parentElement as HTMLElement;

      expect(track.children).toHaveLength(3);

      await act(async () => {
        fireEvent.transitionEnd(track, { propertyName: 'transform' });
      });

      expect(track.children).toHaveLength(2);
      expect(screen.queryByText('Check your email')).toBeNull();
      expect(backOverlayButton()?.getAttribute('aria-label')).toBe(
        'Back to login',
      );
    });

    it('sends the reset verification back to the first screen', async () => {
      authMocks.checkEmail.mockResolvedValue({ flow: 'login' });
      renderOnBoard();

      await goToEmailScreen();
      await submitEmail();
      typeInto(ui().getByPlaceholderText('Password'), 'old-password');
      await clickButton('Forgot Password?');
      await clickBackOverlay();

      expect(ui().getByText('Get together, finally')).toBeTruthy();
    });
  });
});
