import * as NextAuthModule from 'next-auth';
import { getAuthOptionsWithProvider } from '@/lib/authOptions';

// Handle both ESM and CJS default export
const NextAuth = NextAuthModule.default || NextAuthModule;

// Create handler dynamically to avoid build-time issues
async function createHandler(req, context) {
  const authOptions = await getAuthOptionsWithProvider();
  const handler = NextAuth(authOptions);
  return handler(req, context);
}

export async function GET(req, context) {
  return createHandler(req, context);
}

export async function POST(req, context) {
  return createHandler(req, context);
}
