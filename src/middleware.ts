import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if target is a protected route
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isOnboardingRoute = pathname === '/onboarding';

  if (!isDashboardRoute && !isOnboardingRoute) {
    return NextResponse.next();
  }

  // Check for auth token/cookie
  const token = request.cookies.get('sb-access-token')?.value || request.cookies.get('supabase-auth-token')?.value;
  const isLocalAuth = request.cookies.get('vendor_auth_session')?.value;

  const isAuthenticated = Boolean(token || isLocalAuth);

  if (!isAuthenticated) {
    // Unauthenticated user attempting protected route
    if (isDashboardRoute || isOnboardingRoute) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding'],
};
