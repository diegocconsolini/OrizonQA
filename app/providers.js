'use client';

/**
 * Client-side Providers
 *
 * Wraps the application with necessary client-side providers:
 * - SessionProvider: Next-Auth session management
 *
 * This is a client component that wraps children with providers
 * while allowing the root layout to remain a server component.
 */

import { SessionProvider } from 'next-auth/react';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
