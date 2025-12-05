'use client';

/**
 * Video Background Component
 *
 * Persistent video background that stays mounted across page transitions.
 * Placed in the root layout to prevent reloading on navigation.
 *
 * IMPORTANT: The video plays ONCE and stops (no loop).
 * After playback ends, it freezes on the last frame.
 * This is intentional to avoid distracting continuous motion.
 *
 * If the video appears to loop, check:
 * 1. The `loop` attribute should NOT be present on the <video> element
 * 2. The onEnded handler should pause the video
 * 3. Browser caching might serve an old version - hard refresh with Ctrl+Shift+R
 */

import { usePathname } from 'next/navigation';
import { useRef, useEffect, useCallback } from 'react';

// Pages that should show the video background
const VIDEO_PAGES = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];

export default function VideoBackground() {
  const pathname = usePathname();
  const videoRef = useRef(null);
  const hasPlayedRef = useRef(false);

  // Only show video on landing/auth pages
  const showVideo = VIDEO_PAGES.includes(pathname);

  // Handle video end - pause and stay on last frame
  const handleVideoEnd = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      hasPlayedRef.current = true;
    }
  }, []);

  // Reset video when navigating to a video page
  useEffect(() => {
    if (showVideo && videoRef.current) {
      // If coming back to a video page, reset and play from beginning
      if (hasPlayedRef.current) {
        videoRef.current.currentTime = 0;
        hasPlayedRef.current = false;
        videoRef.current.play().catch(() => {
          // Autoplay might be blocked, that's fine
        });
      }
    }
  }, [pathname, showVideo]);

  if (!showVideo) return null;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      >
        <source src="/videos/event-horizon.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-bg-dark/60" />
    </div>
  );
}
