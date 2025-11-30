/**
 * NextAuth v5 Configuration
 *
 * This file configures authentication for the ORIZON app using NextAuth v5.
 * It uses the Credentials provider for email/password authentication.
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
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
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
  pages: {
    signIn: '/login',
    signUp: '/signup',
    error: '/login',
  },
  callbacks: {
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
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
});
