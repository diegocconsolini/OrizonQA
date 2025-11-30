/**
 * Next.js Middleware for Route Protection (NextAuth v5 + Next.js 16)
 *
 * Handles authentication and authorization for the ORIZON app.
 *
 * Protected Routes:
 * - /dashboard/* - Requires authentication
 * - /settings/* - Requires authentication
 * - /history/* - Requires authentication
 * - /analyze (the main app) - Requires authentication
 *
 * Public Routes:
 * - / - Landing page (redirects to /dashboard if authenticated)
 * - /login - Login page (redirects to /dashboard if authenticated)
 * - /signup - Signup page (redirects to /dashboard if authenticated)
 * - /verify-email - Email verification
 * - /forgot-password - Password reset request
 * - /reset-password - Password reset
 * - /showcase - Component showcase (dev only)
 * - /api/* - API routes (handled separately)
 *
 * Features:
 * - JWT session validation via NextAuth v5 (Edge-compatible)
 * - Redirect unauthenticated users to /login
 * - Redirect authenticated users from auth pages to /dashboard
 * - Preserve original URL for post-login redirect
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/settings',
  '/history',
  '/analyze',
];

// Auth routes (redirect to dashboard if already authenticated)
const authRoutes = [
  '/login',
  '/signup',
];

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isAuthenticated = !!req.auth;

  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if current path is an auth route
  const isAuthRoute = authRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Protected routes: Redirect to login if not authenticated
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', nextUrl.origin);
    // Preserve the original URL for redirect after login
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth routes: Redirect to dashboard if already authenticated
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl.origin));
  }

  // Landing page: Redirect authenticated users to dashboard
  if (pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl.origin));
  }

  // Allow all other requests
  return NextResponse.next();
});

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
