import { NextRequest, NextResponse } from 'next/server';


export async function PATCH(request: NextRequest) {
  const formData = await request.formData();
  const avatar = formData.get('avatar');

  if (!(avatar instanceof File)) {
    return NextResponse.json({ error: 'avatar file is required' }, { status: 400 });
  }

  const cookieHeader = request.headers.get('cookie') ?? '';

  // Re-build a fresh FormData so Node.js undici generates a proper
  // multipart boundary when forwarding to Django
  const outgoing = new FormData();
  outgoing.append('avatar', avatar, avatar.name);

  const res = await fetch(`${process.env.BACKEND_URL}/api/user/profile/avatar/`, {
    method: 'PATCH',
    headers: { cookie: cookieHeader }, // NO Content-Type — let fetch set it with boundary
    body: outgoing,
  });
  console.log('Content-Type going to Django:', res.headers.get('content-type'));

  return NextResponse.json(await res.json(), { status: res.status });
}
