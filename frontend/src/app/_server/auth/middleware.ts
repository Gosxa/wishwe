import { NextRequest, NextResponse } from 'next/server';

import { beApi } from '@/app/_server/api/backend';

const redirectToOnboard = (request: NextRequest) =>
  NextResponse.redirect(new URL('/onboard', request.url));

const parseSetCookie = (setCookie: string): [string, string] => {
  const pair = setCookie.split(';')[0];
  const idx = pair.indexOf('=');

  return [pair.slice(0, idx).trim(), pair.slice(idx + 1).trim()];
};

const mergeCookieHeader = (
  cookieHeader: string,
  setCookies: string[],
): string => {
  const jar = new Map<string, string>();

  cookieHeader
    .split(';')
    .map(c => c.trim())
    .filter(Boolean)
    .forEach(c => {
      const idx = c.indexOf('=');

      jar.set(c.slice(0, idx).trim(), c.slice(idx + 1).trim());
    });

  setCookies.forEach(sc => {
    const [name, value] = parseSetCookie(sc);

    jar.set(name, value);
  });

  return [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
};

export async function authMiddleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!accessToken || !refreshToken) return redirectToOnboard(request);

  const cookieHeader = request.headers.get('cookie') ?? '';

  const meRes = await beApi.user.me(cookieHeader);

  if (meRes.ok) return NextResponse.next();

  const refreshRes = await beApi.auth.refreshToken(cookieHeader);

  if (!refreshRes.ok) return redirectToOnboard(request);

  const setCookies = refreshRes.headers.getSetCookie();

  if (setCookies.length === 0) return redirectToOnboard(request);

  const updatedCookieHeader = mergeCookieHeader(cookieHeader, setCookies);

  const retryRes = await beApi.user.me(updatedCookieHeader);

  if (!retryRes.ok) return redirectToOnboard(request);

  const requestHeaders = new Headers(request.headers);

  requestHeaders.set('cookie', updatedCookieHeader);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  setCookies.forEach(c => response.headers.append('set-cookie', c));

  return response;
}
