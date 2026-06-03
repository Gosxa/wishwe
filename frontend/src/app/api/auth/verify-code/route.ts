import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { beApi } from '@/app/_server/api/backend';
import { validate } from '@/app/_server/api/validate';

const schema = z.object({
  email: z.email(),
  code: z.string().length(6),
});

export async function POST(request: NextRequest) {
  const { data, error } = validate(schema, await request.json());

  if (error) return error;

  const res = await beApi.auth.verifyCode(data);

  return NextResponse.json(await res.json(), { status: res.status });
}
