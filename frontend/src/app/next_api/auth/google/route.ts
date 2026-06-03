import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { beApi } from '@/app/_server/api/backend';
import { extractCookieHeader, forwardCookies } from '@/app/_server/api/cookies';
import { validate } from '@/app/_server/api/validate';

const schema = z.object({ token: z.string().min(1) });

export async function POST(request: NextRequest) {
  const { data, error } = validate(schema, await request.json());

  if (error) return error;

  const authRes = await beApi.auth.google(data);

  if (!authRes.ok) {
    return NextResponse.json(await authRes.json(), { status: authRes.status });
  }

  const cookieHeader = extractCookieHeader(authRes);
  const meRes = await beApi.user.me(cookieHeader);

  if (!meRes.ok) {
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: meRes.status },
    );
  }

  const response = NextResponse.json(await meRes.json());

  forwardCookies(response, authRes);

  return response;
}
