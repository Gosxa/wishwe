import { NextRequest, NextResponse } from 'next/server';

import { beApi } from '@/app/_server/api/backend';

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const res = await beApi.notifications.list(cookieHeader);

  return NextResponse.json(await res.json(), { status: res.status });
}
