// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { PublicProfile } from '@/shared/client_api/user/types';
import { UserProfileAbout } from './UserProfileAbout';

const profile = (overrides: Partial<PublicProfile> = {}): PublicProfile => ({
  user_id: 8,
  username: 'smirnyxa',
  avatar: null,
  bio: null,
  first_name: 'Sofia',
  last_name: 'Smirnova',
  date_of_birth: '2001-11-04',
  social_media_url: 'https://instagram.com/smirnyxa',
  is_private: false,
  friendship_status: 'friends',
  ...overrides,
});

const openAbout = () => {
  fireEvent.click(screen.getByRole('button', { name: 'About' }));

  return screen.getByRole('dialog', { name: 'About @smirnyxa' });
};

describe('UserProfileAbout', () => {
  afterEach(cleanup);

  it('reveals the shared profile details on demand', () => {
    render(<UserProfileAbout profile={profile()} />);

    const trigger = screen.getByRole('button', { name: 'About' });

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('dialog')).toBeNull();

    const dialog = openAbout();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(dialog);
    expect(dialog.textContent).toContain('Sofia Smirnova');
    expect(dialog.textContent).toContain('November 4, 2001');

    const link = screen.getByRole('link', { name: /instagram\.com\/smirnyxa/ });

    expect(link.getAttribute('href')).toBe('https://instagram.com/smirnyxa');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders only the details that were shared', () => {
    render(
      <UserProfileAbout
        profile={profile({ first_name: null, last_name: null })}
      />,
    );

    const dialog = openAbout();

    expect(dialog.textContent).not.toContain('Name');
    expect(dialog.textContent).toContain('Birthday');
    expect(dialog.textContent).toContain('Social media');
  });

  it('does not link to unsafe social media values', () => {
    render(
      <UserProfileAbout
        profile={profile({ social_media_url: 'javascript:alert(1)' })}
      />,
    );

    openAbout();

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByText('Social media')).toBeNull();
  });

  it('shows an empty state when nothing was shared', () => {
    render(
      <UserProfileAbout
        profile={profile({
          first_name: null,
          last_name: null,
          date_of_birth: null,
          social_media_url: null,
        })}
      />,
    );

    expect(openAbout().textContent).toContain(
      "@smirnyxa hasn't shared any details yet.",
    );
  });

  it('closes with Escape and returns focus to the trigger', () => {
    render(<UserProfileAbout profile={profile()} />);

    openAbout();
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'About' }),
    );
  });

  it('closes from the close button, the trigger and outside clicks', () => {
    render(
      <>
        <UserProfileAbout profile={profile()} />
        <p>Outside</p>
      </>,
    );

    openAbout();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    openAbout();
    fireEvent.click(screen.getByRole('button', { name: 'About' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    openAbout();
    fireEvent.pointerDown(screen.getByRole('dialog'));
    expect(screen.getByRole('dialog')).toBeTruthy();

    fireEvent.pointerDown(screen.getByText('Outside'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
