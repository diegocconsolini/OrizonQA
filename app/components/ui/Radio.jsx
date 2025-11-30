/**
 * ORIZON Radio Component
 *
 * A radio button component following the ORIZON design system
 * with cosmic styling and smooth animations.
 *
 * Sizes:
 * - sm: 16px
 * - md: 20px (default)
 * - lg: 24px
 *
 * Features:
 * - Event Horizon Blue when selected
 * - Cosmic dot animation
 * - Label support
 * - Group support via RadioGroup
 * - Pure CSS animations
 */

'use client';

export default function Radio({
  checked = false,
  onChange,
  disabled = false,
  size = 'md',
  label,
  value,
  name,
  className = '',
  ...props
}) {
  const handleChange = (e) => {
    if (!disabled && onChange) {
      onChange(e.target.value);
    }
  };

  // Size configurations
  const sizes = {
    sm: {
      outer: 'w-4 h-4',
      inner: 'w-2 h-2',
      text: 'text-sm',
    },
    md: {
      outer: 'w-5 h-5',
      inner: 'w-2.5 h-2.5',
      text: 'text-sm',
    },
    lg: {
      outer: 'w-6 h-6',
      inner: 'w-3 h-3',
      text: 'text-base',
    },
  };

  const sizeConfig = sizes[size];

  const radioElement = (
    <div className="relative inline-flex items-center">
      <input
        type="radio"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        value={value}
        name={name}
        className="sr-only"
        {...props}
      />
      <div
        className={`
          ${sizeConfig.outer}
          rounded-full
          flex items-center justify-center
          transition-all duration-200 ease-out
          ${
            checked
              ? 'bg-primary/20 shadow-[0_0_0_2px_rgba(0,212,255,1)] shadow-glow-primary'
              : 'bg-surface-hover-dark shadow-[0_0_0_1px_rgba(0,212,255,0.1)]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          hover:shadow-glow-primary/50
          focus-within:ring-2 focus-within:ring-primary/30
        `}
      >
        {checked && (
          <div
            className={`
              ${sizeConfig.inner}
              rounded-full
              bg-primary
              transition-all duration-200 ease-out
              animate-scaleIn
            `}
          />
        )}
      </div>
    </div>
  );

  // If no label, return just the radio
  if (!label) {
    return <div className={className}>{radioElement}</div>;
  }

  // With label
  return (
    <label
      className={`
        inline-flex items-center gap-2
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {radioElement}
      <span
        className={`
          font-secondary ${sizeConfig.text}
          ${disabled ? 'text-text-muted-dark' : 'text-white'}
        `}
      >
        {label}
      </span>
    </label>
  );
}

/**
 * Radio Group Component
 * For managing a group of radio buttons
 */
export function RadioGroup({
  value,
  onChange,
  children,
  name,
  className = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} role="radiogroup" {...props}>
      {children}
    </div>
  );
}
