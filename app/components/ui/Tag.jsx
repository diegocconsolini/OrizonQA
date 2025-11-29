/**
 * ORIZON Tag Component
 *
 * A tag/pill component following the ORIZON design system
 * with multiple color variants and sizes.
 *
 * Variants:
 * - primary: Event Horizon Blue
 * - accent: Accretion Orange
 * - quantum: Quantum Violet
 * - success: Green
 * - error: Red
 * - warning: Yellow
 * - neutral: Gray
 *
 * Sizes:
 * - sm: Small (20px height)
 * - md: Medium (24px height, default)
 * - lg: Large (28px height)
 */

import { X } from 'lucide-react';

export default function Tag({
  children,
  variant = 'primary',
  size = 'md',
  outlined = false,
  removable = false,
  onRemove,
  icon,
  className = '',
  ...props
}) {
  // Base styles
  const baseStyles = 'inline-flex items-center gap-1.5 font-secondary font-medium rounded-md transition-all duration-200 ease-out';

  // Variant styles
  const variants = {
    primary: outlined
      ? 'bg-primary/10 border border-primary/30 text-primary'
      : 'bg-primary text-black',
    accent: outlined
      ? 'bg-accent/10 border border-accent/30 text-accent'
      : 'bg-accent text-black',
    quantum: outlined
      ? 'bg-quantum/10 border border-quantum/30 text-quantum'
      : 'bg-quantum text-white',
    success: outlined
      ? 'bg-success/10 border border-success/30 text-success'
      : 'bg-success text-white',
    error: outlined
      ? 'bg-error/10 border border-error/30 text-error'
      : 'bg-error text-white',
    warning: outlined
      ? 'bg-warning/10 border border-warning/30 text-warning'
      : 'bg-warning text-black',
    neutral: outlined
      ? 'bg-white/10 border border-white/20 text-white'
      : 'bg-surface-hover-dark text-white border border-transparent',
  };

  // Size styles
  const sizes = {
    sm: 'h-5 px-2 text-xs',
    md: 'h-6 px-2.5 text-sm',
    lg: 'h-7 px-3 text-sm',
  };

  // Icon size
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  // Combine classes
  const tagClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <span className={tagClasses} {...props}>
      {/* Icon */}
      {icon && (
        <span className={`flex-shrink-0 ${iconSizes[size]}`}>
          {icon}
        </span>
      )}

      {/* Content */}
      <span className="truncate">{children}</span>

      {/* Remove button */}
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
          aria-label="Remove tag"
        >
          <X className={iconSizes[size]} />
        </button>
      )}
    </span>
  );
}

/**
 * Tag Group Component
 * For displaying multiple tags together
 */
export function TagGroup({ children, className = '', ...props }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`} {...props}>
      {children}
    </div>
  );
}
