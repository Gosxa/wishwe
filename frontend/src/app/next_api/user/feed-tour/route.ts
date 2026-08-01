import { NextRequest, NextResponse } from 'next/server';

import { beApi } from '@/app/_server/api/backend';

export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const res = await beApi.user.feedTourSeen(cookieHeader);

  if (res.status === 204) {
    return new NextResponse(null, { status: res.status });
  }

  const data = await res.json().catch(() => ({}));

  return NextResponse.json(data, { status: res.status });
}
