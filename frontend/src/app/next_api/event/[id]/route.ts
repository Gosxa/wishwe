import { NextRequest, NextResponse } from 'next/server';

import { beApi } from '@/app/_server/api/backend';
import { parseEventWriteRequest } from '../eventWriteRequest';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieHeader = request.headers.get('cookie') ?? '';
  const { data, error } = await parseEventWriteRequest(request);

  if (error) return error;

  const res = await beApi.event.update(
    id,
    data.type,
    data.payload,
    cookieHeader,
  );

  return NextResponse.json(await res.json(), { status: res.status });
}
