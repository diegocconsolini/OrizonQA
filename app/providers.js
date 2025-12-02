'use client';

/**
 * Client-side Providers
 *
 * Wraps the application with necessary client-side providers:
 * - SessionProvider: Next-Auth session management
 * - PageTransitionProvider: GSAP page transition state
 * - VideoBackground: Persistent video background for auth pages
 *
 * This is a client component that wraps children with providers
 * while allowing the root layout to remain a server component.
 */

import { SessionProvider } from 'next-auth/react';
import { PageTransitionProvider } from './contexts/PageTransitionContext';
import VideoBackground from './components/layout/VideoBackground';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <PageTransitionProvider>
        <VideoBackground />
        {children}
      </PageTransitionProvider>
    </SessionProvider>
  );
}
