import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

const publicPaths = ['/login', '/forgot-password', '/reset-password'];

export function middleware(request: NextRequest) {
  // Cookie session HttpOnly tetap terbaca di sini karena middleware Next.js
  // jalan di server/edge, bukan browser JS — HttpOnly hanya memblokir document.cookie.
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL(token ? '/dashboard' : '/login', request.url));
  }

  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|storage|img).*)'],
};
