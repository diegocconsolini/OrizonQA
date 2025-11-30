/**
 * ORIZON Button Component
 *
 * A comprehensive button component following the ORIZON design system
 * with cosmic glow effects and multiple variants.
 *
 * Variants:
 * - primary: Event Horizon Blue gradient with cosmic glow
 * - secondary: Accretion Orange gradient with glow
 * - ghost: Transparent with blue border and glow on hover
 * - icon: Square icon button (40x40px) with glow on hover
 *
 * Sizes:
 * - sm: 36px height
 * - md: 44px height (default)
 * - lg: 52px height
 */

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  // Base button styles
  const baseStyles = 'font-secondary font-medium rounded-lg transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black inline-flex items-center justify-center gap-2';

  // Variant styles
  const variants = {
    primary: 'bg-primary hover:bg-primary-hover active:bg-primary-active text-black shadow-glow-primary hover:shadow-glow-primary-lg active:scale-[0.98] focus:ring-primary focus:ring-opacity-50',
    secondary: 'bg-quantum hover:bg-quantum-light text-white shadow-[0_0_20px_rgba(106,0,255,0.3)] hover:shadow-[0_0_40px_rgba(106,0,255,0.5)] active:scale-[0.98] focus:ring-quantum focus:ring-opacity-50',
    ghost: 'bg-transparent text-primary hover:bg-primary/10 hover:shadow-glow-primary active:bg-primary/15 focus:ring-primary focus:ring-opacity-30',
    icon: 'bg-surface-dark text-primary hover:bg-surface-hover-dark hover:shadow-glow-primary active:scale-[0.98] focus:ring-primary focus:ring-opacity-30',
  };

  // Size styles
  const sizes = {
    sm: variant === 'icon' ? 'w-9 h-9 p-0' : 'h-9 px-4 text-sm',
    md: variant === 'icon' ? 'w-10 h-10 p-0' : 'h-11 px-6 text-base',
    lg: variant === 'icon' ? 'w-12 h-12 p-0' : 'h-13 px-8 text-lg',
  };

  // Combine classes
  const buttonClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  // Loading spinner
  const LoadingSpinner = () => (
    <svg
      className="animate-spin h-4 w-4"
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
  );

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {!loading && icon && iconPosition === 'left' && icon}
      {!loading && children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
}
