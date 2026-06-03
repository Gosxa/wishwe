import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { beApi } from '@/app/_server/api/backend';
import { extractCookieHeader, forwardCookies } from '@/app/_server/api/cookies';
import { validate } from '@/app/_server/api/validate';

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
  username: z.string().min(3).max(30),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  const { data, error } = validate(schema, await request.json());

  if (error) return error;

  const { token, password, username, firstName, lastName, avatarUrl } = data;

  const setPasswordRes = await beApi.auth.setPassword({ token, password });

  if (!setPasswordRes.ok) {
    return NextResponse.json(await setPasswordRes.json(), {
      status: setPasswordRes.status,
    });
  }

  const cookieHeader = extractCookieHeader(setPasswordRes);

  const onboardRes = await beApi.user.onboarding(
    { username, first_name: firstName ?? '', last_name: lastName ?? '' },
    cookieHeader,
  );

  if (!onboardRes.ok) {
    return NextResponse.json(await onboardRes.json(), {
      status: onboardRes.status,
    });
  }

  if (avatarUrl) {
    await beApi.user.avatar({ avatar: avatarUrl }, cookieHeader);
  }

  const meRes = await beApi.user.me(cookieHeader);

  if (!meRes.ok) {
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: meRes.status },
    );
  }

  const response = NextResponse.json(await meRes.json());

  forwardCookies(response, setPasswordRes);

  return response;
}
