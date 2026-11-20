import { NextRequest, NextResponse } from 'next/server';

import { beApi } from '@/app/_server/api/backend';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const cookieHeader = request.headers.get('cookie') ?? '';
  const res = await beApi.support.submit(body, cookieHeader);

  return NextResponse.json(await res.json(), { status: res.status });
}
