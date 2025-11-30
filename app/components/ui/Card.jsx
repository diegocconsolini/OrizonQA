/**
 * ORIZON Card Component
 *
 * A flexible card component following the ORIZON design system
 * with cosmic glow effects and multiple variants.
 *
 * Variants:
 * - cosmic: Dark surface with subtle blue glow (default)
 * - feature: With icon container (48×48px)
 * - interactive: Enhanced glow on hover
 * - gradient: Gradient surface background
 *
 * Features:
 * - Dark surface background (#1A1A1A)
 * - 12px border radius
 * - 24px padding
 * - Optional glow effects
 * - Smooth transitions
 */

export default function Card({
  children,
  variant = 'cosmic',
  hoverable = false,
  className = '',
  ...props
}) {
  // Base card styles
  const baseStyles = 'rounded-xl p-6 transition-all duration-200 ease-out';

  // Variant styles - borderless Interstellar style
  const variants = {
    cosmic: 'bg-surface-dark shadow-soft hover:shadow-glow-primary/50',
    feature: 'bg-surface-dark shadow-soft',
    interactive: 'bg-surface-dark shadow-glow-primary hover:shadow-glow-primary-lg hover:scale-[1.02] cursor-pointer',
    gradient: 'bg-gradient-surface shadow-medium',
  };

  // Hoverable enhancement (if variant is not already interactive)
  const hoverableStyles = hoverable && variant !== 'interactive'
    ? 'hover:shadow-glow-primary/50 hover:border-primary/30 cursor-pointer'
    : '';

  // Combine classes
  const cardClasses = `${baseStyles} ${variants[variant]} ${hoverableStyles} ${className}`;

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Header Component
 * For title and description sections
 */
export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Title Component
 */
export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-xl font-primary font-semibold text-white ${className}`} {...props}>
      {children}
    </h3>
  );
}

/**
 * Card Description Component
 */
export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-sm text-text-secondary-dark mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
}

/**
 * Card Content Component
 * Main content area
 */
export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Footer Component
 * For actions and metadata
 */
export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`mt-4 pt-4 border-t border-border-dark flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Icon Container Component
 * 48×48px icon container with cosmic styling
 */
export function CardIcon({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-primary/10 text-primary shadow-glow-primary/30',
    accent: 'bg-accent/10 text-accent shadow-glow-accent/30',
    quantum: 'bg-quantum/10 text-quantum shadow-[0_0_20px_rgba(106,0,255,0.3)]',
  };

  return (
    <div
      className={`w-12 h-12 rounded-lg flex items-center justify-center ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
