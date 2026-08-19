// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import GoogleCallbackPage from './page';

const postMessage = vi.fn();
const close = vi.fn();

const setOpener = (opener: unknown) => {
  Object.defineProperty(window, 'opener', {
    configurable: true,
    writable: true,
    value: opener,
  });
};

const setHash = (hash: string) => {
  window.location.hash = hash;
};

const renderCallback = (hash: string) => {
  setHash(hash);
  render(<GoogleCallbackPage />);
};

describe('auth/google/callback page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setOpener({ postMessage });
    vi.spyOn(window, 'close').mockImplementation(close);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    setHash('');
  });

  it('sends the id token back to the opener and closes the popup', () => {
    renderCallback('#id_token=jwt-value&token_type=Bearer');

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(
      { type: 'google-id-token', token: 'jwt-value' },
      window.location.origin,
    );
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('never broadcasts the token to a wildcard origin', () => {
    renderCallback('#id_token=jwt-value');

    const [, targetOrigin] = postMessage.mock.calls[0];

    expect(targetOrigin).not.toBe('*');
    expect(targetOrigin).toBe(window.location.origin);
  });

  it('decodes percent-escaped values in the hash', () => {
    renderCallback('#id_token=a%2Bb%2Fc');

    expect(postMessage).toHaveBeenCalledWith(
      { type: 'google-id-token', token: 'a+b/c' },
      window.location.origin,
    );
  });

  it('forwards a Google error to the opener', () => {
    renderCallback('#error=access_denied');

    expect(postMessage).toHaveBeenCalledWith(
      { type: 'google-error', error: 'access_denied' },
      window.location.origin,
    );
    expect(close).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['an empty hash', ''],
    ['a hash with no known parameters', '#state=xyz'],
    ['an empty id token', '#id_token='],
  ])('falls back to a generic error for %s', (_label, hash) => {
    renderCallback(hash);

    expect(postMessage).toHaveBeenCalledWith(
      { type: 'google-error', error: 'Unknown error' },
      window.location.origin,
    );
  });

  it('forwards an empty error value as-is', () => {
    renderCallback('#error=');

    expect(postMessage).toHaveBeenCalledWith(
      { type: 'google-error', error: '' },
      window.location.origin,
    );
  });

  it('prefers the token when Google returns both a token and an error', () => {
    renderCallback('#error=access_denied&id_token=jwt-value');

    expect(postMessage).toHaveBeenCalledWith(
      { type: 'google-id-token', token: 'jwt-value' },
      window.location.origin,
    );
  });

  it('still closes the window when the popup has no opener', () => {
    setOpener(null);

    expect(() => renderCallback('#id_token=jwt-value')).not.toThrow();

    expect(postMessage).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('renders nothing', () => {
    setHash('#id_token=jwt-value');

    const { container } = render(<GoogleCallbackPage />);

    expect(container.innerHTML).toBe('');
  });
});
