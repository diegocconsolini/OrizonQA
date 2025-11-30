/**
 * NextAuth v5 API Route Handler
 *
 * This file exports the NextAuth handlers for GET and POST requests.
 * In v5, the handlers are exported from the auth config and simply
 * re-exported here.
 *
 * Handles authentication endpoints:
 * - /api/auth/signin
 * - /api/auth/signout
 * - /api/auth/session
 * - /api/auth/providers
 * - /api/auth/csrf
 */

import { handlers } from '@/auth';

export const { GET, POST } = handlers;
