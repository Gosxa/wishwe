import { NextResponse } from 'next/server';

import { beApi } from '@/app/_server/api/backend';

export async function GET() {
  const res = await beApi.event.categories();

  return NextResponse.json(await res.json(), { status: res.status });
}
