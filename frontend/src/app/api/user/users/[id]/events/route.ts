import { NextRequest, NextResponse } from 'next/server';

import { beApi } from '@/app/_server/api/backend';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieHeader = request.headers.get('cookie') ?? '';
  const query = request.nextUrl.searchParams.toString();
  const res = await beApi.user.events(id, query, cookieHeader);

  return NextResponse.json(await res.json(), { status: res.status });
}
