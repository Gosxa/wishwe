import { NextRequest, NextResponse } from 'next/server';

import { beApi } from '@/app/_server/api/backend';

const redirectToOnboard = (request: NextRequest) =>
  NextResponse.redirect(new URL('/onboard', request.url));

export async function authMiddleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!accessToken || !refreshToken) return redirectToOnboard(request);

  const cookieHeader = request.headers.get('cookie') ?? '';

  const meRes = await beApi.user.me(cookieHeader);

  if (meRes.ok) return NextResponse.next();

  const refreshRes = await beApi.auth.refreshToken(cookieHeader);

  if (!refreshRes.ok) return redirectToOnboard(request);

  const setCookie = refreshRes.headers.get('set-cookie');
  const match = setCookie?.match(/access_token=([^;]+)/);

  if (!match) return redirectToOnboard(request);

  const updatedCookieHeader = cookieHeader.replace(
    /access_token=[^;]+/,
    `access_token=${match[1]}`,
  );

  const retryRes = await beApi.user.me(updatedCookieHeader);

  if (!retryRes.ok) return redirectToOnboard(request);

  const response = NextResponse.next();

  if (setCookie) response.headers.set('set-cookie', setCookie);

  return response;
}
