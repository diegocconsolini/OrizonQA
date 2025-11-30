/**
 * ORIZON Logo Component
 *
 * The ORIZON wordmark with the Gargantua black hole as the "O"
 * Inspired by Interstellar's black hole visualization
 *
 * Variants:
 * - full: Complete wordmark with Gargantua (default)
 * - icon: Just the Gargantua black hole
 * - wordmark: Text only without the special "O"
 *
 * Colors:
 * - blue: Event Horizon Blue (default)
 * - purple: Quantum Violet
 * - white: White on dark backgrounds
 */

export default function Logo({
  variant = 'full',
  color = 'blue',
  size = 'md',
  className = '',
  ...props
}) {
  // Size configurations
  const sizes = {
    sm: { height: 32, fontSize: 'text-xl' },
    md: { height: 48, fontSize: 'text-3xl' },
    lg: { height: 64, fontSize: 'text-5xl' },
    xl: { height: 96, fontSize: 'text-7xl' },
  };

  // Color configurations
  const colors = {
    blue: {
      ring: '#00D4FF',
      glow: 'shadow-glow-primary',
      text: 'text-primary',
    },
    purple: {
      ring: '#6A00FF',
      glow: 'shadow-[0_0_20px_rgba(106,0,255,0.3)]',
      text: 'text-quantum',
    },
    white: {
      ring: '#FFFFFF',
      glow: '',
      text: 'text-white',
    },
  };

  const currentSize = sizes[size];
  const currentColor = colors[color];

  // Gargantua black hole icon (simplified SVG representation)
  const GargantuaIcon = () => (
    <svg
      width={currentSize.height}
      height={currentSize.height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${currentColor.glow}`}
    >
      {/* Black hole singularity (center) */}
      <circle cx="50" cy="50" r="20" fill="#000000" />

      {/* Event horizon ring */}
      <circle
        cx="50"
        cy="50"
        r="35"
        fill="none"
        stroke={currentColor.ring}
        strokeWidth="3"
        opacity="0.8"
      />

      {/* Accretion disk glow */}
      <circle
        cx="50"
        cy="50"
        r="35"
        fill="none"
        stroke={currentColor.ring}
        strokeWidth="1"
        opacity="0.3"
        filter="url(#glow)"
      />

      {/* Glow filter */}
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );

  // Icon only variant
  if (variant === 'icon') {
    return (
      <div className={className} {...props}>
        <GargantuaIcon />
      </div>
    );
  }

  // Wordmark only variant
  if (variant === 'wordmark') {
    return (
      <div className={`font-primary font-bold ${currentSize.fontSize} ${currentColor.text} ${className}`} {...props}>
        ORIZON
      </div>
    );
  }

  // Full logo with Gargantua as "O"
  return (
    <div className={`flex items-center gap-2 ${className}`} {...props}>
      <GargantuaIcon />
      <span className={`font-primary font-bold ${currentSize.fontSize} ${currentColor.text}`}>
        RIZON
      </span>
    </div>
  );
}

/**
 * Logo with tagline
 */
export function LogoWithTagline({
  variant = 'full',
  color = 'blue',
  size = 'md',
  tagline = 'AI-Powered QA Analysis',
  className = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} {...props}>
      <Logo variant={variant} color={color} size={size} />
      <p className="text-sm text-text-secondary-dark font-secondary">{tagline}</p>
    </div>
  );
}
