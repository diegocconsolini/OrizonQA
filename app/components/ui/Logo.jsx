/**
 * ORIZON Logo Component
 *
 * Uses the official Gargantua black hole logos with RIZON wordmark.
 * Based on brand guidelines from mocks/Orizon/rulesOrizon.md
 *
 * Variants:
 * - full: Complete wordmark with Gargantua (logomark IS the "O")
 * - icon: Just the Gargantua black hole
 *
 * Colors:
 * - blue: Event Horizon Blue (primary, default)
 * - orange: Accretion Orange (secondary variant)
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
    xs: 24,
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
    '2xl': 128,
  };

  const heightPx = sizes[size];

  // Icon only variant - just the Gargantua black hole
  if (variant === 'icon') {
    // Choose the appropriate icon based on color and background
    let iconPath;
    if (color === 'orange') {
      iconPath = '/logos/gargantua-orange-light.png';
    } else {
      iconPath = background === 'dark'
        ? '/logos/gargantua-blue-dark.png'
        : '/logos/gargantua-blue-light.png';
    }

    return (
      <div className={`relative inline-block ${className}`} style={{ width: heightPx, height: heightPx }} {...props}>
        <Image
          src={iconPath}
          alt="ORIZON Gargantua"
          fill
          className="object-contain"
        />
      </div>
    );
  }

  // Full logo with RIZON wordmark
  // The full logo image already contains the Gargantua + RIZON wordmark
  if (variant === 'full') {
    // Calculate width based on aspect ratio (approximately 4:1 for full logo)
    const widthPx = heightPx * 4;

    return (
      <div className={`relative inline-block ${className}`} style={{ width: widthPx, height: heightPx }} {...props}>
        <Image
          src="/logos/orizon-full-blue.png"
          alt="ORIZON"
          fill
          className="object-contain object-left"
        />
      </div>
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
