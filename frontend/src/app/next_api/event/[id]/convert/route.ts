import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { beApi } from '@/app/_server/api/backend';
import { validate } from '@/app/_server/api/validate';

const convertSchema = z.object({
  event_date: z.string().min(1),
  event_time: z.string().min(1),
  min_participants: z.coerce.number().int().min(1),
  max_participants: z.coerce.number().int().min(2),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieHeader = request.headers.get('cookie') ?? '';
  const body = (await request.json()) as Record<string, unknown>;

  const { data, error } = validate(convertSchema, body);

  if (error) return error;

  const res = await beApi.event.convert(id, data, cookieHeader);

  return NextResponse.json(await res.json(), { status: res.status });
}
