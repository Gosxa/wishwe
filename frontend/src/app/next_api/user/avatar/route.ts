import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { beApi } from '@/app/_server/api/backend';
import { validate } from '@/app/_server/api/validate';

const schema = z.object({ avatar: z.string().min(1) });

export async function PATCH(request: NextRequest) {
  const { data, error } = validate(schema, await request.json());

  if (error) return error;

  const cookieHeader = request.headers.get('cookie') ?? '';
  const res = await beApi.user.avatar(data, cookieHeader);

  return NextResponse.json(await res.json(), { status: res.status });
}
