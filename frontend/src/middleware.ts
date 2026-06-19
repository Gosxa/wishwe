import { authMiddleware } from '@/app/_server/auth/middleware';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return authMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|fonts|onboard|auth|invite|next_api|test|.*\\.svg|.*\\.ico|.*\\.png|.*\\.jpg|.*\\.webp).*)',
  ],
};
