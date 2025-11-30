/**
 * ORIZON Checkbox Component
 *
 * A checkbox component following the ORIZON design system
 * with cosmic styling and smooth animations.
 *
 * Sizes:
 * - sm: 16px
 * - md: 20px (default)
 * - lg: 24px
 *
 * States:
 * - unchecked: Default state
 * - checked: Checkmark visible
 * - indeterminate: Dash/minus icon
 *
 * Features:
 * - Cosmic checkmark icon
 * - Event Horizon Blue when checked
 * - Smooth animation
 * - Label support
 * - Indeterminate state
 */

'use client';

import { Check, Minus } from 'lucide-react';

export default function Checkbox({
  checked = false,
  indeterminate = false,
  onChange,
  disabled = false,
  size = 'md',
  label,
  className = '',
  ...props
}) {
  const handleChange = (e) => {
    if (!disabled && onChange) {
      onChange(e.target.checked);
    }
  };

  // Size configurations
  const sizes = {
    sm: {
      box: 'w-4 h-4',
      icon: 'w-3 h-3',
      text: 'text-sm',
    },
    md: {
      box: 'w-5 h-5',
      icon: 'w-4 h-4',
      text: 'text-sm',
    },
    lg: {
      box: 'w-6 h-6',
      icon: 'w-5 h-5',
      text: 'text-base',
    },
  };

  const sizeConfig = sizes[size];

  const checkboxElement = (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
        {...props}
      />
      <div
        className={`
          ${sizeConfig.box}
          rounded
          flex items-center justify-center
          transition-all duration-200 ease-out
          ${
            checked || indeterminate
              ? 'bg-primary shadow-glow-primary'
              : 'bg-surface-hover-dark shadow-[0_0_0_1px_rgba(0,212,255,0.1)]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          hover:shadow-glow-primary/50
          focus-within:ring-2 focus-within:ring-primary/30
        `}
      >
        {checked && !indeterminate && (
          <Check className={`${sizeConfig.icon} text-black`} strokeWidth={3} />
        )}
        {indeterminate && (
          <Minus className={`${sizeConfig.icon} text-black`} strokeWidth={3} />
        )}
      </div>
    </div>
  );

  // If no label, return just the checkbox
  if (!label) {
    return <div className={className}>{checkboxElement}</div>;
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
      {checkboxElement}
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
 * Checkbox Group Component
 * For displaying multiple checkboxes in a group
 */
export function CheckboxGroup({ children, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} {...props}>
      {children}
    </div>
  );
}
