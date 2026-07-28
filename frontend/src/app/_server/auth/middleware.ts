import { NextRequest, NextResponse } from 'next/server';

import { beApi } from '@/app/_server/api/backend';
import {
  NEXT_PARAM,
  PATHNAME_HEADER,
  safeNextPath,
} from '@/shared/lib/nextPath';

const requestedPath = (request: NextRequest) =>
  safeNextPath(`${request.nextUrl.pathname}${request.nextUrl.search}`);

const redirectToOnboard = (request: NextRequest) => {
  const url = new URL('/onboard', request.url);
  const next = requestedPath(request);

  if (next) url.searchParams.set(NEXT_PARAM, next);

  return NextResponse.redirect(url);
};

const forward = (request: NextRequest, cookieHeader?: string) => {
  const headers = new Headers(request.headers);
  const next = requestedPath(request);

  if (cookieHeader) headers.set('cookie', cookieHeader);

  if (next) headers.set(PATHNAME_HEADER, next);
  else headers.delete(PATHNAME_HEADER);

  return NextResponse.next({ request: { headers } });
};

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
  // The landing page at "/" is public; it handles the authed→/feed redirect itself.
  if (request.nextUrl.pathname === '/') return NextResponse.next();

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!accessToken || !refreshToken) return redirectToOnboard(request);

  const cookieHeader = request.headers.get('cookie') ?? '';

  const meRes = await beApi.user.me(cookieHeader);

  if (meRes.ok) return forward(request);

  const refreshRes = await beApi.auth.refreshToken(cookieHeader);

  if (!refreshRes.ok) return redirectToOnboard(request);

  const setCookies = refreshRes.headers.getSetCookie();

  if (setCookies.length === 0) return redirectToOnboard(request);

  const updatedCookieHeader = mergeCookieHeader(cookieHeader, setCookies);

  const retryRes = await beApi.user.me(updatedCookieHeader);

  if (!retryRes.ok) return redirectToOnboard(request);

  const response = forward(request, updatedCookieHeader);

  setCookies.forEach(c => response.headers.append('set-cookie', c));

  return response;
}
