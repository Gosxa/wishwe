import { NextRequest, NextResponse } from 'next/server';

import { beApi } from '@/app/_server/api/backend';

export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const res = await beApi.user.websocketTicket(cookieHeader);
  const body = await res.json().catch(() => ({ detail: 'Request failed' }));
  const response = NextResponse.json(body, { status: res.status });

  response.headers.set('Cache-Control', 'private, no-store');

  return response;
}
