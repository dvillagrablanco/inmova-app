import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Todas las rutas API son dinámicas - no deben pre-renderizarse
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    response.headers.set('x-middleware-cache', 'no-cache');
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
