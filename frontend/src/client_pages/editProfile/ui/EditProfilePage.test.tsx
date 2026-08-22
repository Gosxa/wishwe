// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Profile } from '@/shared/client_api/auth/types';

const mocks = vi.hoisted(() => ({
  cancelEdit: vi.fn(),
  changePasswordSubmit: vi.fn(),
  editResult: {} as Record<string, unknown>,
  submitEdit: vi.fn(),
  useChangePassword: vi.fn(),
  useEditProfile: vi.fn(),
}));

vi.mock('../model/useEditProfile', () => ({
  useEditProfile: mocks.useEditProfile,
}));

vi.mock('../widgets/changePasswordModal/model/useChangePassword', () => ({
  useChangePassword: mocks.useChangePassword,
}));

vi.mock('@widgets/header', () => ({
  Header: ({ showSearch }: { showSearch?: boolean }) => (
    <header data-show-search={String(showSearch)} />
  ),
}));

vi.mock('@/shared/store/useUserStore', () => ({
  useUserStore: (
    selector: (state: { user: { avatar: string | null } }) => unknown,
  ) => selector({ user: { avatar: null } }),
}));

vi.mock('@/features', () => ({
  useBodyScrollLock: vi.fn(),
}));

vi.mock('@shared/hooks/useModalAttention', () => ({
  useModalAttention: () => vi.fn(),
}));

vi.mock('@shared/hooks/useModalTransition', () => ({
  useModalTransition: (onClose: () => void) => ({
    modalTransitionProps: {},
    requestClose: onClose,
  }),
}));

import EditProfilePage from './EditProfilePage';

const profile: Profile = {
  id: 1,
  user: 'alice@example.com',
  user_id: 7,
  username: 'alice',
  first_name: 'Alice',
  last_name: 'Stone',
  bio: 'Always planning something',
  date_of_birth: '1994-03-12',
  city: null,
  gender: 'Female',
  avatar: 'https://cdn.test/alice.jpg',
  social_media_url: 'https://example.com/alice',
  is_private: false,
  has_seen_feed_tour: true,
};

const input = (value: string) => ({
  value,
  onChange: vi.fn(),
});

describe('EditProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.editResult = {
      avatar: {
        onChange: vi.fn(),
        onCropCancel: vi.fn(),
        onCropConfirm: vi.fn(),
        rawImageUrl: null,
        url: profile.avatar,
      },
      bio: input(profile.bio ?? ''),
      dateOfBirth: input(profile.date_of_birth ?? ''),
      firstName: input(profile.first_name ?? ''),
      formError: 'Profile could not be saved',
      gender: input(profile.gender ?? ''),
      isDirty: true,
      lastName: input(profile.last_name ?? ''),
      nickname: input(profile.username ?? ''),
      onCancel: mocks.cancelEdit,
      onSubmit: mocks.submitEdit,
      privacy: {
        checked: true,
        helperText: 'Your profile can be found by other users via search.',
        onChange: vi.fn(),
      },
      socialMediaUrl: input(profile.social_media_url ?? ''),
    };
    mocks.useEditProfile.mockImplementation(() => mocks.editResult);
    mocks.useChangePassword.mockReturnValue({
      confirmInput: input('new-password'),
      currentInput: input('current-password'),
      newInput: input('new-password'),
      submit: {
        error: undefined,
        isValid: true,
        onSubmit: mocks.changePasswordSubmit,
      },
    });
  });

  afterEach(cleanup);

  it('renders model values and wires the page actions', () => {
    const { container } = render(<EditProfilePage initialUser={profile} />);

    expect(mocks.useEditProfile).toHaveBeenCalledWith(profile);
    expect(
      (screen.getByLabelText('Your nickname') as HTMLInputElement).value,
    ).toBe('alice');
    expect(
      (screen.getByLabelText('Your bio') as HTMLTextAreaElement).value,
    ).toBe('Always planning something');
    expect((screen.getByLabelText('Gender') as HTMLSelectElement).value).toBe(
      'Female',
    );
    expect(screen.getByText('Profile could not be saved')).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'Profile' })
        .getAttribute('aria-current'),
    ).toBe('page');
    expect(container.querySelector('header')?.dataset.showSearch).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(mocks.cancelEdit).toHaveBeenCalledTimes(1);
    expect(mocks.submitEdit).toHaveBeenCalledTimes(1);
  });

  it('opens the password dialog and connects its submit and close actions', () => {
    render(<EditProfilePage initialUser={profile} />);

    fireEvent.click(screen.getByRole('button', { name: 'Change password?' }));

    expect(
      screen.getByRole('dialog', { name: 'Change password' }),
    ).toBeTruthy();
    expect(mocks.useChangePassword).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getAllByRole('button', { name: 'Save changes' })[1]);
    expect(mocks.changePasswordSubmit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('keeps the save action disabled when the model is clean', () => {
    mocks.editResult = { ...mocks.editResult, isDirty: false };

    render(<EditProfilePage initialUser={profile} />);

    expect(
      (
        screen.getByRole('button', {
          name: 'Save changes',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});
