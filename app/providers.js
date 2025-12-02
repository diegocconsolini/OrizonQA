'use client';

/**
 * Client-side Providers
 *
 * Wraps the application with necessary client-side providers:
 * - SessionProvider: Next-Auth session management
 * - PageTransitionProvider: GSAP page transition state
 *
 * This is a client component that wraps children with providers
 * while allowing the root layout to remain a server component.
 */

import { SessionProvider } from 'next-auth/react';
import { PageTransitionProvider } from './contexts/PageTransitionContext';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <PageTransitionProvider>
        {children}
      </PageTransitionProvider>
    </SessionProvider>
  );
}
