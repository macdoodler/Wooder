import { NextRequest, NextResponse } from 'next/server';

// Define the middleware
export function middleware(request: NextRequest) {
  // Only intercept API routes in development
  if (process.env.NODE_ENV === 'development' && request.nextUrl.pathname.startsWith('/api/')) {
    console.log('[Middleware] Intercepting API request in development mode');
  }
  
  // Continue to the next middleware or API route
  return NextResponse.next();
}

// Configure which paths this middleware runs on
export const config = {
  matcher: '/api/:path*',
};