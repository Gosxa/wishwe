import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { beApi } from '@/app/_server/api/backend';
import { validate } from '@/app/_server/api/validate';

const schema = z.object({
  username: z.string().min(3).max(30),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  const { data, error } = validate(schema, await request.json());

  if (error) return error;

  const cookieHeader = request.headers.get('cookie') ?? '';
  const res = await beApi.user.onboarding(data, cookieHeader);

  return NextResponse.json(await res.json(), { status: res.status });
}
