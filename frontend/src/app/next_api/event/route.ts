import { NextRequest, NextResponse } from 'next/server';

import { beApi } from '@/app/_server/api/backend';
import { parseEventWriteRequest } from './eventWriteRequest';

export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const { data, error } = await parseEventWriteRequest(request);

  if (error) return error;

  const res = await beApi.event.create(data.type, data.payload, cookieHeader);

  return NextResponse.json(await res.json(), { status: res.status });
}
