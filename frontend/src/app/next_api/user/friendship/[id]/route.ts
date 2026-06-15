import { NextRequest, NextResponse } from 'next/server';

import { beApi } from '@/app/_server/api/backend';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieHeader = request.headers.get('cookie') ?? '';
  const res = await beApi.user.friendshipRemove(id, cookieHeader);

  return new NextResponse(null, { status: res.status });
}
