import { NextRequest, NextResponse } from 'next/server';

import { beApi } from '@/app/_server/api/backend';

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username') ?? '';
  const res = await beApi.user.checkUsername(username);

  return NextResponse.json(await res.json(), { status: res.status });
}
