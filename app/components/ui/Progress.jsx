/**
 * ORIZON Progress Component
 *
 * Progress indicator components following the ORIZON design system
 * with cosmic glow effects and smooth animations.
 *
 * Variants:
 * - bar: Linear progress bar (default)
 * - circle: Circular progress indicator
 * - spinner: Loading spinner with cosmic glow
 *
 * Color variants:
 * - primary: Event Horizon Blue (default)
 * - accent: Accretion Orange
 * - success: Green
 */

'use client';

export default function Progress({
  value = 0,
  max = 100,
  variant = 'primary',
  showValue = false,
  size = 'md',
  className = '',
  ...props
}) {
  // Calculate percentage
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // Variant styles
  const variants = {
    primary: 'bg-gradient-primary shadow-glow-primary',
    accent: 'bg-gradient-accent shadow-glow-accent',
    success: 'bg-success',
  };

  // Size styles
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={`w-full ${className}`} {...props}>
      {/* Progress bar background */}
      <div className={`w-full bg-surface-dark rounded-full overflow-hidden ${sizes[size]}`}>
        {/* Progress bar fill */}
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${variants[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Optional value display */}
      {showValue && (
        <div className="mt-1 text-xs text-text-secondary-dark text-right">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}

/**
 * Circular Progress Component
 */
export function CircularProgress({
  value = 0,
  max = 100,
  variant = 'primary',
  size = 80,
  strokeWidth = 8,
  showValue = true,
  className = '',
  ...props
}) {
  // Calculate percentage
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // Variant colors
  const variants = {
    primary: '#00D4FF',
    accent: '#FF9500',
    success: '#10B981',
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`} {...props}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2A2A2A"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={variants[variant]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{
            filter: variant === 'primary'
              ? 'drop-shadow(0 0 8px rgba(0, 212, 255, 0.5))'
              : variant === 'accent'
              ? 'drop-shadow(0 0 8px rgba(255, 149, 0, 0.5))'
              : 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))'
          }}
        />
      </svg>

      {/* Value text */}
      {showValue && (
        <div className="absolute text-center">
          <span className="text-xl font-primary font-semibold text-white">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Loading Spinner Component
 * Orbital cosmic spinner
 */
export function Spinner({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  // Size styles
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  // Variant colors
  const variants = {
    primary: 'text-primary',
    accent: 'text-accent',
    white: 'text-white',
  };

  return (
    <div
      className={`inline-block ${sizes[size]} ${variants[variant]} ${className}`}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <svg
        className="animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}
