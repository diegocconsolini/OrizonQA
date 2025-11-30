/**
 * Auth Utilities
 *
 * Helper functions for authentication that can be imported
 * without circular dependency issues.
 */

import { getServerSession as getNextAuthServerSession } from 'next-auth';

/**
 * Get the server session for API routes and server components
 * Must import authOptions from the route file to avoid circular deps
 */
export async function getServerSession() {
  const { authOptions } = await import('@/app/api/auth/[...nextauth]/route');
  return getNextAuthServerSession(authOptions);
}
