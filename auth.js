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
import { createConnection } from '@/lib/db-oauth-connections';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      // Default: Only request basic user info (no repo access)
      authorization: {
        params: {
          scope: 'read:user user:email',
          // prompt is controlled per-login via the "Remember me" checkbox
          // When unchecked, 'consent' is passed to show account selection
        },
      },
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
    async authorized({ auth, request }) {
      // Use the base config's authorized callback
      return authConfig.callbacks.authorized({ auth, request });
    },
    async jwt({ token, user, account, profile }) {
      // For GitHub OAuth, we need to look up the database user ID and securely store the access token
      if (account?.provider === 'github' && user?.email) {
        try {
          const email = user.email.toLowerCase();

          // Mark provider type (no token in JWT for security)
          token.provider = 'github';

          // Check if user exists
          let result = await query(
            'SELECT id, email, full_name FROM users WHERE email = $1',
            [email]
          );

          // If user doesn't exist yet (signIn callback runs after jwt in some cases)
          // We create the user here as well to ensure token always has correct ID
          if (result.rows.length === 0) {
            console.log('JWT: Creating new GitHub user:', email);
            result = await query(`
              INSERT INTO users (email, full_name, email_verified, is_active, created_at)
              VALUES ($1, $2, true, true, NOW())
              ON CONFLICT (email) DO UPDATE SET last_login = NOW()
              RETURNING id, email, full_name
            `, [email, user.name || email.split('@')[0]]);
          }

          if (result.rows.length > 0) {
            token.id = String(result.rows[0].id);
            token.email = result.rows[0].email;
            token.name = result.rows[0].full_name || user.name;

            // Store GitHub access token securely in database (encrypted)
            // This replaces storing it in the JWT
            if (account.access_token) {
              try {
                await createConnection({
                  userId: parseInt(result.rows[0].id, 10),
                  provider: 'github_auth',
                  providerUserId: String(profile?.id || user.id),
                  providerUsername: profile?.login || email.split('@')[0],
                  accessToken: account.access_token,
                  refreshToken: account.refresh_token || null,
                  tokenExpiresAt: account.expires_at
                    ? new Date(account.expires_at * 1000)
                    : null,
                  scopes: ['read:user', 'user:email'],
                  metadata: {
                    purpose: 'authentication',
                    createdAt: new Date().toISOString(),
                  },
                });
                console.log('GitHub auth token stored securely for user:', email);
              } catch (dbError) {
                // Log but don't fail login if token storage fails
                console.error('Failed to store GitHub token:', dbError.message);
              }
            }
          }
        } catch (error) {
          console.error('JWT callback error for GitHub user:', error);
        }
      } else if (user) {
        // Credentials provider - user.id is already correct
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.provider = 'credentials';
      }
      return token;
    },
    async session({ session, token }) {
      // Add user ID to session from token
      if (token && session.user) {
        session.user.id = token.id;
      }
      return session;
    },
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
