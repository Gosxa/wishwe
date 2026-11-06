import { NextRequest, NextResponse } from 'next/server';
import { beApi } from '@/app/_server/api/backend';

type Context = { params: Promise<{ id: string }> };

export const DELETE = async (request: NextRequest, { params }: Context) => {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      { detail: 'Invalid notification id' },
      { status: 400 },
    );
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  const response = await beApi.notifications.delete(id, cookieHeader);
  return new NextResponse(null, { status: response.status });
};
