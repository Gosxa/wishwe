import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { beApi } from '@/app/_server/api/backend';
import { validate } from '@/app/_server/api/validate';

const schema = z.object({
  token: z.string().min(1),
  new_password: z.string().min(8),
  re_new_password: z.string().min(8),
}).refine(d => d.new_password === d.re_new_password, {
  message: 'Passwords do not match',
  path: ['re_new_password'],
});

export async function POST(request: NextRequest) {
  const { data, error } = validate(schema, await request.json());

  if (error) return error;

  const res = await beApi.auth.setNewPassword(data);

  return NextResponse.json(await res.json(), { status: res.status });
}
