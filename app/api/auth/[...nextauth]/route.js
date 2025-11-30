import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db.js';

/**
 * Next-Auth Configuration for ORIZON
 *
 * - Uses Credentials provider for email/password login
 * - Validates email verification before allowing login
 * - Updates last_login timestamp on successful login
 * - Session stored as JWT (no database sessions for simplicity)
 */

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const { email, password } = credentials;

        // Find user by email
        const result = await query(
          'SELECT * FROM users WHERE email = $1',
          [email]
        );

        const user = result.rows[0];

        if (!user) {
          throw new Error('Invalid email or password');
        }

        if (!user.email_verified) {
          throw new Error('Please verify your email first');
        }

        if (!user.is_active) {
          throw new Error('Account is inactive. Contact support.');
        }

        // Verify password
        const valid = await bcrypt.compare(password, user.password_hash);

        if (!valid) {
          throw new Error('Invalid email or password');
        }

        // Update last login timestamp
        await query(
          'UPDATE users SET last_login = NOW() WHERE id = $1',
          [user.id]
        );

        // Return user object (will be encoded in JWT)
        return {
          id: user.id,
          email: user.email,
          name: user.full_name,
        };
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
      if (token) {
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
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
