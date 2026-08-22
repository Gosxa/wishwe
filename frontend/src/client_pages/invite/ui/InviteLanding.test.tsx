// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { InviteLanding } from './InviteLanding';

describe('InviteLanding', () => {
  afterEach(cleanup);

  it('shows the inviter and keeps the raw token encoded in the join link', () => {
    render(
      <InviteLanding
        token="invite/a b#c"
        username="@alice"
        avatarSrc="https://cdn.test/alice.jpg"
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: 'See what @alice is planning next',
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('img', { name: '@alice profile' }).getAttribute('src'),
    ).toBe('https://cdn.test/alice.jpg');
    expect(
      screen.getByRole('link', { name: 'Join' }).getAttribute('href'),
    ).toBe('/invite/invite%2Fa%20b%23c/join');
    expect(
      screen
        .getByRole('link', { name: 'Explore the app' })
        .getAttribute('href'),
    ).toBe('/onboard');
  });

  it('renders a safe placeholder when inviter details are unavailable', () => {
    render(<InviteLanding token="expired" />);

    expect(
      screen.getByRole('heading', {
        name: 'See what [@username] is planning next',
      }),
    ).toBeTruthy();
    expect(screen.queryByRole('img', { name: /profile/ })).toBeNull();
  });
});
