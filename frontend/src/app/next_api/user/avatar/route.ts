import { NextRequest, NextResponse } from 'next/server';

import { beApi } from '@/app/_server/api/backend';

export async function PATCH(request: NextRequest) {
  const formData = await request.formData();
  const avatar = formData.get('avatar');

  if (!(avatar instanceof File)) {
    return NextResponse.json(
      { error: 'avatar file is required' },
      { status: 400 },
    );
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  const res = await beApi.user.avatar(formData, cookieHeader);

  return NextResponse.json(await res.json(), { status: res.status });
}
