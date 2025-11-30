/**
 * Auth Utilities
 *
 * Helper functions for authentication that can be imported
 * without circular dependency issues.
 */

import { getServerSession as getNextAuthServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

/**
 * Get the server session for API routes and server components
 */
export async function getServerSession() {
  return getNextAuthServerSession(authOptions);
}

// Re-export authOptions for convenience
export { authOptions };
