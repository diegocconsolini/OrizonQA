/**
 * Next-Auth Configuration
 *
 * Separated from the route handler because Next.js App Router
 * route handlers can only export HTTP methods (GET, POST, etc.)
 */

export const authOptions = {
  providers: [],
  pages: {
    signIn: '/login',
    signUp: '/signup',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
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
};

// Dynamic provider setup - will be populated at runtime
// This avoids build-time issues with pg module
export async function getAuthOptionsWithProvider() {
  const CredentialsProvider = (await import('next-auth/providers/credentials')).default;

  return {
    ...authOptions,
    providers: [
      CredentialsProvider({
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
            const { query } = await import('@/lib/db');
            const bcrypt = (await import('bcryptjs')).default;

            const { email, password } = credentials;

            const result = await query(
              'SELECT * FROM users WHERE email = $1',
              [email.toLowerCase()]
            );

            const user = result.rows?.[0];

            if (!user) {
              return null;
            }

            if (!user.email_verified) {
              throw new Error('Please verify your email first');
            }

            if (!user.is_active) {
              throw new Error('Account is inactive. Contact support.');
            }

            const valid = await bcrypt.compare(password, user.password_hash);

            if (!valid) {
              return null;
            }

            await query(
              'UPDATE users SET last_login = NOW() WHERE id = $1',
              [user.id]
            );

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
  };
}
