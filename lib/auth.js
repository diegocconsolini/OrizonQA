/**
 * Auth Utilities (NextAuth v5)
 *
 * Helper functions for authentication that can be imported
 * in server components and API routes.
 *
 * In NextAuth v5, the auth() function replaces getServerSession().
 * This file re-exports auth utilities from the main auth config.
 */

import { auth, signIn, signOut } from '@/auth';

/**
 * Get the current session (v5 auth function)
 * Use this in server components and API routes
 */
export { auth };

/**
 * Server-side sign in/out functions
 */
export { signIn, signOut };

/**
 * Backwards compatibility alias
 * @deprecated Use auth() directly instead
 */
export const getServerSession = auth;
