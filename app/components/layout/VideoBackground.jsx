'use client';

/**
 * Video Background Component
 *
 * Persistent video background that stays mounted across page transitions.
 * Placed in the root layout to prevent reloading on navigation.
 */

import { usePathname } from 'next/navigation';

// Pages that should show the video background
const VIDEO_PAGES = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];

export default function VideoBackground() {
  const pathname = usePathname();

  // Only show video on landing/auth pages
  const showVideo = VIDEO_PAGES.includes(pathname);

  if (!showVideo) return null;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <video
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      >
        <source src="/videos/event-horizon.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-bg-dark/60" />
    </div>
  );
}
