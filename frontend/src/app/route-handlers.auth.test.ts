import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { backendMocks } from './route-handler-backend-mocks';

import {
  googleAuth,
  jsonRequest,
  jsonResponse,
  login,
  malformedJsonRequest,
  register,
} from './route-handler-test-kit';

vi.mock('@/app/_server/api/backend', async () => {
  const { backendMocks: mocks } = await import('./route-handler-backend-mocks');

  return { beApi: mocks };
});

describe('authentication orchestration route handlers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const authenticationCases = [
    {
      name: 'password login',
      mock: backendMocks.auth.getTokens,
      body: { email: 'amy@example.com', password: 'secret-password' },
      invoke: (req: NextRequest) => login(req),
      expectedAuthError: {
        detail: 'Invalid credentials',
        code: 'authentication_failed',
      },
    },
    {
      name: 'Google login',
      mock: backendMocks.auth.google,
      body: { token: 'google-id-token' },
      invoke: (req: NextRequest) => googleAuth(req),
      expectedAuthError: { error: 'backend error' },
    },
  ];

  it.each(authenticationCases)(
    '$name gets the profile with new cookies and forwards complete cookies',
    async ({ mock, body, invoke }) => {
      const accessCookie =
        'access_token=access-value; Path=/; HttpOnly; SameSite=Lax';
      const refreshCookie =
        'refresh_token=refresh-value; Path=/; HttpOnly; SameSite=Lax';
      const profile = { user_id: 42, username: 'amy' };

      mock.mockResolvedValueOnce(
        jsonResponse({ detail: 'authenticated' }, 200, [
          accessCookie,
          refreshCookie,
        ]),
      );
      backendMocks.user.me.mockResolvedValueOnce(jsonResponse(profile));

      const response = await invoke(
        jsonRequest('/next_api/auth/session', body),
      );

      expect(mock).toHaveBeenCalledWith(body);
      expect(backendMocks.user.me).toHaveBeenCalledWith(
        'access_token=access-value; refresh_token=refresh-value',
      );
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(profile);
      expect(response.headers.getSetCookie()).toEqual([
        accessCookie,
        refreshCookie,
      ]);
    },
  );

  it.each(authenticationCases)(
    '$name surfaces an authentication error and skips the profile call',
    async ({ mock, body, invoke, expectedAuthError }) => {
      const backendBody = {
        detail: 'Invalid credentials',
        code: 'authentication_failed',
      };

      mock.mockResolvedValueOnce(jsonResponse(backendBody, 401));

      const response = await invoke(
        jsonRequest('/next_api/auth/session', body),
      );

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual(expectedAuthError);
      expect(backendMocks.user.me).not.toHaveBeenCalled();
    },
  );

  it.each(authenticationCases)(
    '$name reports a profile lookup failure without exposing its body',
    async ({ mock, body, invoke }) => {
      mock.mockResolvedValueOnce(
        jsonResponse({}, 200, ['access_token=value; Path=/; HttpOnly']),
      );
      backendMocks.user.me.mockResolvedValueOnce(
        jsonResponse({ private_debug: 'do not expose' }, 503),
      );

      const response = await invoke(
        jsonRequest('/next_api/auth/session', body),
      );

      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual({
        error: 'Failed to get profile',
      });
      expect(response.headers.getSetCookie()).toEqual([]);
    },
  );

  it.each([
    {
      name: 'password login',
      mock: backendMocks.auth.getTokens,
      body: { email: 'not-an-email', password: '' },
      invoke: (req: NextRequest) => login(req),
    },
    {
      name: 'Google login',
      mock: backendMocks.auth.google,
      body: { token: '' },
      invoke: (req: NextRequest) => googleAuth(req),
    },
  ])(
    'rejects invalid $name input before authentication',
    async ({ mock, body, invoke }) => {
      const response = await invoke(
        jsonRequest('/next_api/auth/session', body),
      );

      expect(response.status).toBe(400);
      expect(mock).not.toHaveBeenCalled();
      expect(backendMocks.user.me).not.toHaveBeenCalled();
    },
  );

  it.each(authenticationCases)(
    '$name rejects malformed JSON before authentication',
    async ({ mock, invoke }) => {
      await expect(
        invoke(malformedJsonRequest('/next_api/auth/session')),
      ).rejects.toBeInstanceOf(SyntaxError);
      expect(mock).not.toHaveBeenCalled();
    },
  );

  it('completes registration in order and maps profile field names', async () => {
    const sessionCookie =
      'access_token=registered; Path=/; HttpOnly; SameSite=Lax';
    const registration = {
      token: 'verification-token',
      password: 'new-password',
      username: 'new_user',
      firstName: 'New',
      lastName: 'User',
    };

    backendMocks.auth.setPassword.mockResolvedValueOnce(
      jsonResponse({}, 200, [sessionCookie]),
    );
    backendMocks.user.onboarding.mockResolvedValueOnce(jsonResponse({}));
    backendMocks.user.me.mockResolvedValueOnce(
      jsonResponse({ user_id: 77, username: 'new_user' }),
    );

    const response = await register(
      jsonRequest('/next_api/auth/register', registration),
    );

    expect(backendMocks.auth.setPassword).toHaveBeenCalledWith({
      token: 'verification-token',
      password: 'new-password',
    });
    expect(backendMocks.user.onboarding).toHaveBeenCalledWith(
      { username: 'new_user', first_name: 'New', last_name: 'User' },
      'access_token=registered',
    );
    expect(backendMocks.user.me).toHaveBeenCalledWith(
      'access_token=registered',
    );
    expect(response.headers.getSetCookie()).toEqual([sessionCookie]);
    await expect(response.json()).resolves.toEqual({
      user_id: 77,
      username: 'new_user',
    });
    expect(
      backendMocks.auth.setPassword.mock.invocationCallOrder[0],
    ).toBeLessThan(backendMocks.user.onboarding.mock.invocationCallOrder[0]);
    expect(
      backendMocks.user.onboarding.mock.invocationCallOrder[0],
    ).toBeLessThan(backendMocks.user.me.mock.invocationCallOrder[0]);
  });

  it('normalizes omitted registration names to empty strings', async () => {
    backendMocks.auth.setPassword.mockResolvedValueOnce(
      jsonResponse({}, 200, ['access_token=registered; Path=/']),
    );
    backendMocks.user.onboarding.mockResolvedValueOnce(jsonResponse({}));
    backendMocks.user.me.mockResolvedValueOnce(jsonResponse({ user_id: 78 }));

    await register(
      jsonRequest('/next_api/auth/register', {
        token: 'verification-token',
        password: 'new-password',
        username: 'new_user',
      }),
    );

    expect(backendMocks.user.onboarding).toHaveBeenCalledWith(
      { username: 'new_user', first_name: '', last_name: '' },
      'access_token=registered',
    );
  });

  it.each([
    {
      name: 'password setup',
      failingMock: backendMocks.auth.setPassword,
      status: 400,
      body: { password: ['Too common'] },
      expectOnboarding: false,
      expectProfile: false,
    },
    {
      name: 'onboarding',
      failingMock: backendMocks.user.onboarding,
      status: 409,
      body: { username: ['Already taken'] },
      expectOnboarding: true,
      expectProfile: false,
    },
  ])(
    'preserves a registration $name error and stops the sequence',
    async ({ failingMock, status, body, expectOnboarding, expectProfile }) => {
      backendMocks.auth.setPassword.mockResolvedValueOnce(
        jsonResponse({}, 200, ['access_token=registered; Path=/']),
      );
      backendMocks.user.onboarding.mockResolvedValueOnce(jsonResponse({}));
      failingMock.mockReset();
      failingMock.mockResolvedValueOnce(jsonResponse(body, status));

      const response = await register(
        jsonRequest('/next_api/auth/register', {
          token: 'verification-token',
          password: 'new-password',
          username: 'new_user',
        }),
      );

      expect(response.status).toBe(status);
      await expect(response.json()).resolves.toEqual(body);
      expect(backendMocks.user.onboarding).toHaveBeenCalledTimes(
        expectOnboarding ? 1 : 0,
      );
      expect(backendMocks.user.me).toHaveBeenCalledTimes(expectProfile ? 1 : 0);
    },
  );

  it('reports a registration profile failure without forwarding cookies', async () => {
    backendMocks.auth.setPassword.mockResolvedValueOnce(
      jsonResponse({}, 200, ['access_token=registered; Path=/']),
    );
    backendMocks.user.onboarding.mockResolvedValueOnce(jsonResponse({}));
    backendMocks.user.me.mockResolvedValueOnce(jsonResponse({}, 502));

    const response = await register(
      jsonRequest('/next_api/auth/register', {
        token: 'verification-token',
        password: 'new-password',
        username: 'new_user',
      }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to get profile',
    });
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it('rejects invalid and malformed registration input', async () => {
    const invalidResponse = await register(
      jsonRequest('/next_api/auth/register', {
        token: '',
        password: 'short',
        username: 'ab',
      }),
    );

    expect(invalidResponse.status).toBe(400);
    expect(backendMocks.auth.setPassword).not.toHaveBeenCalled();

    await expect(
      register(malformedJsonRequest('/next_api/auth/register')),
    ).rejects.toBeInstanceOf(SyntaxError);
    expect(backendMocks.auth.setPassword).not.toHaveBeenCalled();
  });
});
