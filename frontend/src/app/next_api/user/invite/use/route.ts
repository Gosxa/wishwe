import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { beApi } from '@/app/_server/api/backend';
import { validate } from '@/app/_server/api/validate';

const schema = z.object({ token: z.string().uuid() });

export async function POST(request: NextRequest) {
  const { data, error } = validate(schema, await request.json());

  if (error) return error;

  const cookieHeader = request.headers.get('cookie') ?? '';
  const res = await beApi.user.inviteUse(data.token, cookieHeader);

  return NextResponse.json(await res.json(), { status: res.status });
}
