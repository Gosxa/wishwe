// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const supportMocks = vi.hoisted(() => ({
  submit: vi.fn(),
}));

vi.mock('@widgets/header', () => ({ Header: () => null }));

vi.mock('@/shared/client_api/support', () => ({
  submitSupportRequest: supportMocks.submit,
  SupportRequestError: class SupportRequestError extends Error {},
}));

import { SupportPage } from './SupportPage';

const renderPage = () =>
  render(
    <SupportPage
      initialDisplayName="Alex Wish"
      initialEmail="alex@example.com"
    />,
  );

describe('SupportPage', () => {
  beforeEach(() => {
    supportMocks.submit.mockReset();
  });

  afterEach(() => cleanup());

  it('prefills account details and submits the selected category', async () => {
    supportMocks.submit.mockResolvedValue({
      id: 'request-id',
      delivery_status: 'sent',
      support_email: 'support@wishwe.test',
    });
    renderPage();

    const email = screen.getByLabelText('Email') as HTMLInputElement;
    const name = screen.getByLabelText(/Name or nickname/) as HTMLInputElement;
    const category = screen.getByLabelText('What’s this about?');
    const message = screen.getByLabelText('Your message');

    expect(email.value).toBe('alex@example.com');
    expect(name.value).toBe('Alex Wish');

    fireEvent.change(category, { target: { value: 'feature_idea' } });
    fireEvent.change(message, {
      target: { value: 'Add a way to save favorite events.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send message/ }));

    await waitFor(() => {
      expect(supportMocks.submit).toHaveBeenCalledWith({
        email: 'alex@example.com',
        display_name: 'Alex Wish',
        category: 'feature_idea',
        message: 'Add a way to save favorite events.',
      });
    });
    expect(
      screen.getByRole('heading', { name: 'Thanks for reaching out!' }),
    ).toBeTruthy();
  });

  it('shows an email fallback when delivery fails', async () => {
    supportMocks.submit.mockResolvedValue({
      id: 'request-id',
      delivery_status: 'failed',
      support_email: 'support@wishwe.test',
    });
    renderPage();
    fireEvent.change(screen.getByLabelText('Your message'), {
      target: { value: 'I need help with my account.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send message/ }));

    expect(await screen.findByText('Your note is saved.')).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'Email us directly' })
        .getAttribute('href'),
    ).toBe('mailto:support@wishwe.test');
  });

  it('shows an accessible error when submission fails', async () => {
    supportMocks.submit.mockRejectedValue(new Error('network error'));
    renderPage();
    fireEvent.change(screen.getByLabelText('Your message'), {
      target: { value: 'I need help with my account.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send message/ }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Something went wrong. Please try again.',
    );
  });
});
