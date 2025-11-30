/**
 * ORIZON Avatar Component
 *
 * A user avatar component following the ORIZON design system
 * with cosmic styling and status indicators.
 *
 * Sizes:
 * - xs: 24px
 * - sm: 32px
 * - md: 40px (default)
 * - lg: 48px
 * - xl: 64px
 * - 2xl: 96px
 *
 * Features:
 * - Image support
 * - Initials fallback
 * - Status indicator (online, offline, busy, away)
 * - Group avatars
 * - Borderless Interstellar design with cosmic glow
 */

'use client';

import { User } from 'lucide-react';

export default function Avatar({
  src,
  alt = '',
  initials,
  size = 'md',
  status,
  shape = 'circle',
  className = '',
  ...props
}) {
  // Size configurations
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-24 h-24 text-2xl',
  };

  // Shape styles
  const shapes = {
    circle: 'rounded-full',
    square: 'rounded-lg',
  };

  // Status indicator sizes
  const statusSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5',
  };

  // Status colors
  const statusColors = {
    online: 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    offline: 'bg-text-muted-dark',
    busy: 'bg-error shadow-[0_0_8px_rgba(239,68,68,0.5)]',
    away: 'bg-accent shadow-[0_0_8px_rgba(255,149,0,0.5)]',
  };

  return (
    <div className={`relative inline-block ${className}`} {...props}>
      <div
        className={`
          ${sizes[size]}
          ${shapes[shape]}
          flex items-center justify-center
          overflow-hidden
          bg-surface-hover-dark
          shadow-[0_0_0_1px_rgba(0,212,255,0.1)]
          hover:shadow-glow-primary/30
          transition-all duration-200 ease-out
        `}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : initials ? (
          <span className="font-secondary font-semibold text-primary uppercase">
            {initials}
          </span>
        ) : (
          <User className="w-1/2 h-1/2 text-text-muted-dark" />
        )}
      </div>

      {/* Status Indicator */}
      {status && (
        <span
          className={`
            absolute bottom-0 right-0
            ${statusSizes[size]}
            ${statusColors[status]}
            ${shapes[shape]}
            border-2 border-bg-dark
          `}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

/**
 * Avatar Group Component
 * For displaying multiple overlapping avatars
 */
export function AvatarGroup({
  children,
  max = 3,
  size = 'md',
  className = '',
  ...props
}) {
  const avatars = Array.isArray(children) ? children : [children];
  const displayAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className={`flex items-center ${className}`} {...props}>
      {displayAvatars.map((avatar, index) => (
        <div
          key={index}
          className="-ml-2 first:ml-0 ring-2 ring-bg-dark rounded-full"
          style={{ zIndex: displayAvatars.length - index }}
        >
          {avatar}
        </div>
      ))}

      {remainingCount > 0 && (
        <div className="-ml-2 ring-2 ring-bg-dark rounded-full" style={{ zIndex: 0 }}>
          <Avatar
            size={size}
            initials={`+${remainingCount}`}
            className="bg-primary/20 text-primary"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Example usage:
 *
 * <Avatar
 *   src="/avatar.jpg"
 *   alt="User Name"
 *   size="lg"
 *   status="online"
 * />
 *
 * <Avatar
 *   initials="JD"
 *   size="md"
 *   status="busy"
 * />
 *
 * <AvatarGroup max={3}>
 *   <Avatar src="/user1.jpg" alt="User 1" />
 *   <Avatar src="/user2.jpg" alt="User 2" />
 *   <Avatar initials="AB" />
 *   <Avatar initials="CD" />
 * </AvatarGroup>
 */
