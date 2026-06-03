import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { beApi } from '@/app/_server/api/backend';
import { extractCookieHeader, forwardCookies } from '@/app/_server/api/cookies';
import { validate } from '@/app/_server/api/validate';

const schema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const { data, error } = validate(schema, await request.json());

  if (error) return error;

  const tokenRes = await beApi.auth.getTokens(data);

  if (!tokenRes.ok) {
    return NextResponse.json(await tokenRes.json(), { status: tokenRes.status });
  }

  const cookieHeader = extractCookieHeader(tokenRes);
  const meRes = await beApi.user.me(cookieHeader);

  if (!meRes.ok) {
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: meRes.status },
    );
  }

  const response = NextResponse.json(await meRes.json());

  forwardCookies(response, tokenRes);

  return response;
}
