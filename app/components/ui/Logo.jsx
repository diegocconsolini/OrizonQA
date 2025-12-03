/**
 * ORIZON Logo Component
 *
 * Uses the official Gargantua black hole logos with RIZON wordmark.
 * Based on brand guidelines from mocks/Orizon/rulesOrizon.md
 * All logos have transparent backgrounds for flexible use.
 *
 * Variants:
 * - full: Complete wordmark with Gargantua (logomark IS the "O")
 * - icon: Just the Gargantua black hole
 *
 * Colors:
 * - blue: Event Horizon Blue (primary, default) - #00D4FF
 * - purple: Quantum Violet (secondary variant) - #6A00FF
 *
 * Background:
 * - dark: Optimized for dark backgrounds (default)
 * - light: Optimized for light backgrounds
 *
 * Important: The wordmark is "RIZON" not "ORIZON" - the Gargantua logomark IS the "O"
 */

'use client';

import Image from 'next/image';

export default function Logo({
  variant = 'full',
  color = 'blue',
  size = 'md',
  background = 'dark',
  className = '',
  ...props
}) {
  // Size configurations (in pixels for height)
  const sizes = {
    xs: 32,
    sm: 48,
    md: 64,
    lg: 96,
    xl: 160,
    '2xl': 200,
    '3xl': 256,
  };

  const heightPx = sizes[size];

  // Icon only variant - just the Gargantua black hole
  if (variant === 'icon') {
    // Choose the appropriate icon based on color and background
    let iconPath;
    if (color === 'purple') {
      // Purple variant (converted from orange) - always use dark version for now
      iconPath = '/logos/gargantua-purple-icon.png';
    } else {
      // Blue variant (default)
      iconPath = background === 'dark'
        ? '/logos/orizon-icon-blue-darkv2.png'
        : '/logos/gargantua-blue-light.png';
    }

    return (
      <Image
        src={iconPath}
        alt="ORIZON Gargantua"
        width={heightPx}
        height={heightPx}
        className={`object-contain ${className}`}
        priority
        {...props}
      />
    );
  }

  // Full logo with RIZON wordmark
  // The full logo image already contains the Gargantua + RIZON wordmark
  if (variant === 'full') {
    // Calculate width based on aspect ratio (approximately 4:1 for full logo)
    const widthPx = heightPx * 4;

    // Choose the appropriate full logo based on color and background
    let logoPath;
    if (color === 'purple') {
      // Purple variant - currently only have dark version
      logoPath = '/logos/orizon-full-purple-dark.png';
    } else {
      // Blue variant (default) - use official transparent logos
      logoPath = background === 'dark'
        ? '/logos/orizon-full-blue-darkv2.png'  // White letters for dark backgrounds (v2)
        : '/logos/orizon-full-blue-black.png';  // Black letters for light backgrounds
    }

    return (
      <Image
        src={logoPath}
        alt="ORIZON"
        width={widthPx}
        height={heightPx}
        className={`object-contain object-left ${className}`}
        priority
        {...props}
      />
    );
  }

  // Fallback
  return null;
}

/**
 * Logo with tagline
 */
export function LogoWithTagline({
  variant = 'full',
  color = 'blue',
  size = 'md',
  background = 'dark',
  tagline = 'AI-Powered QA Analysis',
  className = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} {...props}>
      <Logo variant={variant} color={color} size={size} background={background} />
      <p className="text-sm text-text-secondary-dark font-secondary">{tagline}</p>
    </div>
  );
}
