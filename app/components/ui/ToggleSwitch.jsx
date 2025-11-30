/**
 * ORIZON Toggle Switch Component
 *
 * A toggle switch component following the ORIZON design system
 * with cosmic styling and smooth slide animations.
 *
 * Sizes:
 * - sm: 36×20px
 * - md: 44×24px (default)
 * - lg: 52×28px
 *
 * Colors:
 * - primary: Event Horizon Blue (default)
 * - secondary: Quantum Violet
 *
 * Features:
 * - Smooth slide animation
 * - Disabled state
 * - Label support (left/right positioning)
 * - Pure CSS animations
 */

'use client';

export default function ToggleSwitch({
  checked = false,
  onChange,
  disabled = false,
  size = 'md',
  color = 'primary',
  label,
  labelPosition = 'right',
  className = '',
  ...props
}) {
  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  // Size configurations
  const sizes = {
    sm: {
      track: 'w-9 h-5',
      thumb: 'w-4 h-4',
      translate: checked ? 'translate-x-4' : 'translate-x-0.5',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: checked ? 'translate-x-5' : 'translate-x-0.5',
    },
    lg: {
      track: 'w-13 h-7',
      thumb: 'w-6 h-6',
      translate: checked ? 'translate-x-6' : 'translate-x-0.5',
    },
  };

  // Color configurations
  const colors = {
    primary: checked
      ? 'bg-primary shadow-glow-primary'
      : 'bg-surface-hover-dark',
    secondary: checked
      ? 'bg-quantum shadow-[0_0_20px_rgba(106,0,255,0.3)]'
      : 'bg-surface-hover-dark',
  };

  const sizeConfig = sizes[size];
  const colorConfig = colors[color];

  const switchElement = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleToggle}
      disabled={disabled}
      className={`
        relative inline-flex items-center
        ${sizeConfig.track}
        rounded-full
        transition-all duration-200 ease-out
        ${colorConfig}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-primary/30
      `}
      {...props}
    >
      {/* Thumb */}
      <span
        className={`
          ${sizeConfig.thumb}
          rounded-full
          bg-white
          shadow-md
          transition-transform duration-200 ease-out
          ${sizeConfig.translate}
        `}
      />
    </button>
  );

  // If no label, return just the switch
  if (!label) {
    return <div className={className}>{switchElement}</div>;
  }

  // With label
  return (
    <label
      className={`
        inline-flex items-center gap-3
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {labelPosition === 'left' && (
        <span className={`font-secondary text-sm ${disabled ? 'text-text-muted-dark' : 'text-white'}`}>
          {label}
        </span>
      )}

      {switchElement}

      {labelPosition === 'right' && (
        <span className={`font-secondary text-sm ${disabled ? 'text-text-muted-dark' : 'text-white'}`}>
          {label}
        </span>
      )}
    </label>
  );
}

/**
 * Toggle Group Component
 * For displaying multiple toggles in a group
 */
export function ToggleGroup({ children, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
}
