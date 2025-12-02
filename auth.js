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
import GitHub from 'next-auth/providers/github';
import { authConfig } from '@/auth.config';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      profile(profile) {
        return {
          id: String(profile.id),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
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
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      // Handle GitHub OAuth sign in
      if (account?.provider === 'github') {
        try {
          const email = user.email?.toLowerCase();

          if (!email) {
            console.error('GitHub OAuth: No email provided');
            return false;
          }

          // Check if user exists
          const existingUser = await query(
            'SELECT * FROM users WHERE email = $1',
            [email]
          );

          if (existingUser.rows.length === 0) {
            // Create new user for GitHub OAuth
            const result = await query(`
              INSERT INTO users (email, full_name, email_verified, is_active, created_at)
              VALUES ($1, $2, true, true, NOW())
              RETURNING id, email, full_name
            `, [email, user.name || email.split('@')[0]]);

            user.id = String(result.rows[0].id);

            // Log audit event
            await query(`
              INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent, created_at)
              VALUES ($1, $2, $3, $4, $5, NOW())
            `, [
              result.rows[0].id,
              'user_registered',
              JSON.stringify({ method: 'github_oauth', email }),
              null,
              null
            ]);
          } else {
            // User exists, update last login
            user.id = String(existingUser.rows[0].id);
            await query(
              'UPDATE users SET last_login = NOW() WHERE id = $1',
              [existingUser.rows[0].id]
            );
          }

          return true;
        } catch (error) {
          console.error('GitHub OAuth error:', error);
          return false;
        }
      }

      // Default for credentials provider
      return true;
    },
  },
});
