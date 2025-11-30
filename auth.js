/**
 * NextAuth v5 Full Configuration (Node.js Runtime)
 *
 * This file extends the base edge-compatible config (auth.config.js)
 * with database and crypto operations for use in Server Components
 * and API Routes.
 *
 * The split configuration pattern allows:
 * - Edge runtime middleware to use auth.config.js (no database/crypto)
 * - Server components to use this file (with database/crypto)
 *
 * Key Features:
 * - Email/password authentication with database verification
 * - Email verification requirement
 * - Account status checking (active/inactive)
 * - Last login timestamp tracking
 * - JWT session strategy with 30-day expiration
 * - Custom session callbacks to include user ID
 *
 * Environment Variables Required:
 * - NEXTAUTH_SECRET: Secret for signing JWT tokens
 * - NEXTAUTH_URL: Application URL (e.g., http://localhost:3033)
 * - POSTGRES_URL: PostgreSQL connection string
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from '@/auth.config';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const { email, password } = credentials;

          // Fetch user from database
          const result = await query(
            'SELECT * FROM users WHERE email = $1',
            [email.toLowerCase()]
          );

          const user = result.rows?.[0];

          if (!user) {
            return null;
          }

          // Check email verification
          if (!user.email_verified) {
            throw new Error('Please verify your email first');
          }

          // Check account status
          if (!user.is_active) {
            throw new Error('Account is inactive. Contact support.');
          }

          // Verify password
          const valid = await bcrypt.compare(password, user.password_hash);

          if (!valid) {
            return null;
          }

          // Update last login timestamp
          await query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
          );

          // Return user object for session
          return {
            id: String(user.id),
            email: user.email,
            name: user.full_name,
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      }
    })
  ],
});
