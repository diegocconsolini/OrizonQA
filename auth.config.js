/**
 * NextAuth v5 Base Configuration (Edge-Compatible)
 *
 * This config contains only edge-compatible settings (no database, no crypto).
 * It's used by middleware which runs in Edge runtime.
 *
 * The full auth config (auth.js) extends this with database adapter and
 * credentials provider for use in Server Components and API Routes.
 */

export const authConfig = {
  pages: {
    signIn: '/login',
    signUp: '/signup',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      // This callback runs in Edge runtime middleware
      // It's used for route protection
      const isLoggedIn = !!auth?.user;

      // Protected routes
      const protectedRoutes = ['/dashboard', '/settings', '/history', '/analyze'];
      const isProtectedRoute = protectedRoutes.some(route =>
        nextUrl.pathname === route || nextUrl.pathname.startsWith(`${route}/`)
      );

      // Auth routes (login, signup)
      const authRoutes = ['/login', '/signup'];
      const isAuthRoute = authRoutes.some(route =>
        nextUrl.pathname === route || nextUrl.pathname.startsWith(`${route}/`)
      );

      // Redirect logic handled by middleware
      return true; // Allow all, let middleware handle redirects
    },
    async jwt({ token, user }) {
      // Add user ID to token on initial sign in
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user ID to session from token
      if (token && session.user) {
        session.user.id = token.id;
      }
      return session;
    }
  },
  providers: [], // Providers added in auth.js (not edge-compatible)
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
