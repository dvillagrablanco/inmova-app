import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Public paths that don't require authentication
  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/api/auth',
    '/api/webhooks',
    '/_next',
    '/favicon.ico',
    '/images',
    '/public',
  ];

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // If user is authenticated and trying to access landing, allow it
  // (they might want to see the landing while logged in)
  if (pathname === '/' && token) {
    // Optional: redirect authenticated users to dashboard
    // return NextResponse.redirect(new URL('/dashboard', request.url));

    // Or allow them to see the landing
    return NextResponse.next();
  }

  // If user is not authenticated and trying to access protected routes
  if (!token && !isPublicPath) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access auth pages
  if (token && (pathname === '/login' || pathname === '/register' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
