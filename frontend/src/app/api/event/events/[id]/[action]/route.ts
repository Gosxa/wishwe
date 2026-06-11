import { NextRequest, NextResponse } from 'next/server';

import { beApi } from '@/app/_server/api/backend';

const ALLOWED_ACTIONS = [
  'join_plan',
  'interested_in_wish',
  'leave_event',
] as const;

type AllowedAction = (typeof ALLOWED_ACTIONS)[number];

const isAllowedAction = (action: string): action is AllowedAction =>
  (ALLOWED_ACTIONS as readonly string[]).includes(action);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> },
) {
  const { id, action } = await params;

  if (!isAllowedAction(action)) {
    return NextResponse.json({ detail: 'Not found.' }, { status: 404 });
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  const res = await beApi.event.action(id, action, cookieHeader);

  return NextResponse.json(await res.json(), { status: res.status });
}
