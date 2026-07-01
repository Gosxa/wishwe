import { NextRequest, NextResponse } from 'next/server';

import { beApi } from '@/app/_server/api/backend';

export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const body = await request.json().catch(() => ({}));
  const res = await beApi.user.friendshipSend(body, cookieHeader);
  const data = await res.json().catch(() => ({}));

  return NextResponse.json(data, { status: res.status });
}
