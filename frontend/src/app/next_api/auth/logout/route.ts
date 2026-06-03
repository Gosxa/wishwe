import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { beApi } from '@/app/_server/api/backend';
import { forwardCookies } from '@/app/_server/api/cookies';
import { validate } from '@/app/_server/api/validate';

const schema = z.object({ email: z.string() });

export async function POST(request: NextRequest) {
  const { data, error } = validate(schema, await request.json());

  if (error) return error;

  const cookieHeader = request.headers.get('cookie') ?? '';
  const res = await beApi.auth.logout(data, cookieHeader);

  const response = NextResponse.json(await res.json(), { status: res.status });

  forwardCookies(response, res);

  return response;
}
