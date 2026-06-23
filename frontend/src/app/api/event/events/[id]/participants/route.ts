import { NextRequest, NextResponse } from 'next/server';

import { beApi } from '@/app/_server/api/backend';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const cookieHeader = request.headers.get('cookie') ?? '';
  const res = await beApi.event.participants(id, cookieHeader);

  return NextResponse.json(await res.json(), { status: res.status });
}
