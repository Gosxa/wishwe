import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { backendMocks } from './route-handler-backend-mocks';

import {
  changePassword,
  checkEmail,
  consumeInvite,
  context,
  convertEvent,
  COOKIE,
  jsonRequest,
  jsonResponse,
  logout,
  malformedJsonRequest,
  onboardUser,
  request,
  resetPassword,
  setNewPassword,
  updateAvatar,
  updateProfile,
  verifyCode,
} from './route-handler-test-kit';

vi.mock('@/app/_server/api/backend', async () => {
  const { backendMocks: mocks } = await import('./route-handler-backend-mocks');

  return { beApi: mocks };
});

describe('validated JSON route handlers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const validationCases = [
    {
      name: 'email check',
      mock: backendMocks.auth.emailStart,
      path: '/next_api/auth/check-email',
      method: 'POST',
      validBody: { email: 'amy@example.com' },
      forwardedBody: { email: 'amy@example.com' },
      invalidBody: { email: 'not-an-email' },
      invalidField: 'email',
      invoke: (req: NextRequest) => checkEmail(req),
      expectedArgs: [{ email: 'amy@example.com' }],
    },
    {
      name: 'verification code',
      mock: backendMocks.auth.verifyCode,
      path: '/next_api/auth/verify-code',
      method: 'POST',
      validBody: { email: 'amy@example.com', code: '012345' },
      forwardedBody: { email: 'amy@example.com', code: '012345' },
      invalidBody: { email: 'amy@example.com', code: '12345' },
      invalidField: 'code',
      invoke: (req: NextRequest) => verifyCode(req),
      expectedArgs: [{ email: 'amy@example.com', code: '012345' }],
    },
    {
      name: 'password reset',
      mock: backendMocks.auth.resetPassword,
      path: '/next_api/auth/reset-password',
      method: 'POST',
      validBody: { email: 'amy@example.com' },
      forwardedBody: { email: 'amy@example.com' },
      invalidBody: { email: '' },
      invalidField: 'email',
      invoke: (req: NextRequest) => resetPassword(req),
      expectedArgs: [{ email: 'amy@example.com' }],
    },
    {
      name: 'new password',
      mock: backendMocks.auth.setNewPassword,
      path: '/next_api/auth/set-new-password',
      method: 'POST',
      validBody: {
        token: 'reset-token',
        new_password: 'new-password',
        re_new_password: 'new-password',
      },
      forwardedBody: {
        token: 'reset-token',
        new_password: 'new-password',
        re_new_password: 'new-password',
      },
      invalidBody: {
        token: 'reset-token',
        new_password: 'new-password',
        re_new_password: 'different-password',
      },
      invalidField: 're_new_password',
      invoke: (req: NextRequest) => setNewPassword(req),
      expectedArgs: [
        {
          token: 'reset-token',
          new_password: 'new-password',
          re_new_password: 'new-password',
        },
      ],
    },
    {
      name: 'logout',
      mock: backendMocks.auth.logout,
      path: '/next_api/auth/logout',
      method: 'POST',
      validBody: { email: 'amy@example.com' },
      forwardedBody: { email: 'amy@example.com' },
      invalidBody: { email: 123 },
      invalidField: 'email',
      invoke: (req: NextRequest) => logout(req),
      expectedArgs: [{ email: 'amy@example.com' }, COOKIE],
    },
    {
      name: 'password change',
      mock: backendMocks.user.changePassword,
      path: '/next_api/user/change-password',
      method: 'POST',
      validBody: {
        old_password: 'old-password',
        new_password: 'new-password',
      },
      forwardedBody: {
        old_password: 'old-password',
        new_password: 'new-password',
      },
      invalidBody: { old_password: 'short', new_password: 'also-short' },
      invalidField: 'old_password',
      invoke: (req: NextRequest) => changePassword(req),
      expectedArgs: [
        { old_password: 'old-password', new_password: 'new-password' },
        COOKIE,
      ],
    },
    {
      name: 'invite use',
      mock: backendMocks.user.inviteUse,
      path: '/next_api/user/invite/use',
      method: 'POST',
      validBody: { token: '89d16b0f-6f08-47db-8bc2-76cc45cd505b' },
      forwardedBody: { token: '89d16b0f-6f08-47db-8bc2-76cc45cd505b' },
      invalidBody: { token: 'not-a-uuid' },
      invalidField: 'token',
      invoke: (req: NextRequest) => consumeInvite(req),
      expectedArgs: ['89d16b0f-6f08-47db-8bc2-76cc45cd505b', COOKIE],
    },
    {
      name: 'onboarding',
      mock: backendMocks.user.onboarding,
      path: '/next_api/user/onboard',
      method: 'PATCH',
      validBody: {
        username: 'amy_lee',
        first_name: 'Amy',
        last_name: 'Lee',
        ignored: 'strip me',
      },
      forwardedBody: {
        username: 'amy_lee',
        first_name: 'Amy',
        last_name: 'Lee',
      },
      invalidBody: { username: 'ab' },
      invalidField: 'username',
      invoke: (req: NextRequest) => onboardUser(req),
      expectedArgs: [
        { username: 'amy_lee', first_name: 'Amy', last_name: 'Lee' },
        COOKIE,
      ],
    },
    {
      name: 'profile update',
      mock: backendMocks.user.updateProfile,
      path: '/next_api/user/profile',
      method: 'PATCH',
      validBody: {
        username: 'amy_lee',
        bio: 'Planning good things',
        is_private: true,
        date_of_birth: null,
        gender: 'Other',
        ignored: 'strip me',
      },
      forwardedBody: {
        username: 'amy_lee',
        bio: 'Planning good things',
        is_private: true,
        date_of_birth: null,
        gender: 'Other',
      },
      invalidBody: { gender: 'Unknown' },
      invalidField: 'gender',
      invoke: (req: NextRequest) => updateProfile(req),
      expectedArgs: [
        {
          username: 'amy_lee',
          bio: 'Planning good things',
          is_private: true,
          date_of_birth: null,
          gender: 'Other',
        },
        COOKIE,
      ],
    },
    {
      name: 'wish conversion',
      mock: backendMocks.event.convert,
      path: '/next_api/event/evt-6/convert',
      method: 'POST',
      validBody: {
        event_date: '2027-02-03',
        event_time: '18:30',
        min_participants: '2',
        max_participants: '8',
        ignored: 'strip me',
      },
      forwardedBody: {
        event_date: '2027-02-03',
        event_time: '18:30',
        min_participants: 2,
        max_participants: 8,
      },
      invalidBody: {
        event_date: '',
        event_time: '18:30',
        min_participants: 0,
        max_participants: 1,
      },
      invalidField: 'event_date',
      invoke: (req: NextRequest) => convertEvent(req, context({ id: 'evt-6' })),
      expectedArgs: [
        'evt-6',
        {
          event_date: '2027-02-03',
          event_time: '18:30',
          min_participants: 2,
          max_participants: 8,
        },
        COOKIE,
      ],
    },
  ];

  it.each(validationCases)(
    'validates and forwards a valid $name payload',
    async ({ mock, path, method, validBody, invoke, expectedArgs }) => {
      const backendBody = { detail: 'field conflict', field: 'username' };

      mock.mockResolvedValueOnce(jsonResponse(backendBody, 409));

      const response = await invoke(
        jsonRequest(path, validBody, method, COOKIE),
      );

      expect(mock).toHaveBeenCalledOnce();
      expect(mock).toHaveBeenCalledWith(...expectedArgs);
      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toEqual(backendBody);
    },
  );

  it.each(validationCases)(
    'returns field-level 400 errors for an invalid $name payload',
    async ({ mock, path, method, invalidBody, invalidField, invoke }) => {
      const response = await invoke(
        jsonRequest(path, invalidBody, method, COOKIE),
      );
      const body = (await response.json()) as {
        error: Record<string, string[]>;
      };

      expect(response.status).toBe(400);
      expect(body.error).toHaveProperty(invalidField);
      expect(mock).not.toHaveBeenCalled();
    },
  );

  it.each(validationCases)(
    'does not call Django when $name receives malformed JSON',
    async ({ mock, path, method, invoke }) => {
      await expect(
        invoke(malformedJsonRequest(path, method)),
      ).rejects.toBeInstanceOf(SyntaxError);
      expect(mock).not.toHaveBeenCalled();
    },
  );

  it('allows an empty profile patch because every field is optional', async () => {
    backendMocks.user.updateProfile.mockResolvedValueOnce(
      jsonResponse({ updated: true }),
    );

    const response = await updateProfile(
      jsonRequest('/next_api/user/profile', {}, 'PATCH', COOKIE),
    );

    expect(backendMocks.user.updateProfile).toHaveBeenCalledWith({}, COOKIE);
    expect(response.status).toBe(200);
  });

  it('forwards logout cookie rotation from Django', async () => {
    const expiredAccess =
      'access_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax';
    const expiredRefresh =
      'refresh_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax';

    backendMocks.auth.logout.mockResolvedValueOnce(
      jsonResponse({ detail: 'Logged out' }, 200, [
        expiredAccess,
        expiredRefresh,
      ]),
    );

    const response = await logout(
      jsonRequest(
        '/next_api/auth/logout',
        { email: 'amy@example.com' },
        'POST',
        COOKIE,
      ),
    );

    expect(response.headers.getSetCookie()).toEqual([
      expiredAccess,
      expiredRefresh,
    ]);
  });

  it('propagates an unexpected failure after successful validation', async () => {
    const failure = new TypeError('connection reset');

    backendMocks.user.changePassword.mockRejectedValueOnce(failure);

    await expect(
      changePassword(
        jsonRequest(
          '/next_api/user/change-password',
          { old_password: 'old-password', new_password: 'new-password' },
          'POST',
          COOKIE,
        ),
      ),
    ).rejects.toBe(failure);
  });
});

describe('avatar upload route handler', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('forwards a multipart avatar, cookies, status, and JSON body', async () => {
    const data = new FormData();

    data.set('display_crop', 'square');
    data.set(
      'avatar',
      new File(['avatar bytes'], 'avatar.webp', { type: 'image/webp' }),
    );
    backendMocks.user.avatar.mockResolvedValueOnce(
      jsonResponse({ avatar_url: 'https://cdn.example/avatar.webp' }, 201),
    );

    const response = await updateAvatar(
      request('/next_api/user/avatar', {
        method: 'PATCH',
        headers: { cookie: COOKIE },
        body: data,
      }),
    );
    const forwardedData = backendMocks.user.avatar.mock.calls[0][0] as FormData;

    expect(forwardedData.get('avatar')).toBeInstanceOf(File);
    expect(forwardedData.get('display_crop')).toBe('square');
    expect(backendMocks.user.avatar).toHaveBeenCalledWith(
      forwardedData,
      COOKIE,
    );
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      avatar_url: 'https://cdn.example/avatar.webp',
    });
  });

  it.each([
    ['a missing avatar', new FormData()],
    [
      'a text avatar field',
      (() => {
        const data = new FormData();

        data.set('avatar', 'not-a-file');

        return data;
      })(),
    ],
  ])('returns 400 for %s', async (_name, data) => {
    const response = await updateAvatar(
      request('/next_api/user/avatar', {
        method: 'PATCH',
        headers: { cookie: COOKIE },
        body: data,
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'avatar file is required',
    });
    expect(backendMocks.user.avatar).not.toHaveBeenCalled();
  });

  it('rejects malformed multipart before calling Django', async () => {
    const malformed = request('/next_api/user/avatar', {
      method: 'PATCH',
      headers: {
        cookie: COOKIE,
        'content-type': 'multipart/form-data; boundary=missing',
      },
      body: 'invalid multipart',
    });

    await expect(updateAvatar(malformed)).rejects.toThrow();
    expect(backendMocks.user.avatar).not.toHaveBeenCalled();
  });

  it('propagates an unexpected avatar backend failure', async () => {
    const data = new FormData();
    const failure = new TypeError('upload service unavailable');

    data.set('avatar', new File(['avatar'], 'avatar.png'));
    backendMocks.user.avatar.mockRejectedValueOnce(failure);

    await expect(
      updateAvatar(
        request('/next_api/user/avatar', {
          method: 'PATCH',
          headers: { cookie: COOKIE },
          body: data,
        }),
      ),
    ).rejects.toBe(failure);
  });
});
