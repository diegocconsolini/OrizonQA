/**
 * ORIZON Select Component
 *
 * A select dropdown component following the ORIZON design system
 * with dark theme styling and cosmic focus effects.
 *
 * Features:
 * - Dark surface background (#1A1A1A)
 * - Event Horizon Blue focus ring
 * - Custom styled arrow icon
 * - 44px height
 * - Optional label and helper text
 * - Error state support
 */

import { ChevronDown } from 'lucide-react';

export default function Select({
  label,
  helperText,
  error,
  options = [],
  disabled = false,
  placeholder = 'Select an option',
  className = '',
  ...props
}) {
  // Base select styles
  const baseStyles = 'w-full h-11 px-4 pr-10 bg-surface-dark border rounded-lg font-secondary text-base text-white appearance-none cursor-pointer transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed';

  // Border styles (normal, focused, error) - borderless Interstellar style
  const borderStyles = error
    ? 'border-0 focus:ring-2 focus:ring-error/30 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]'
    : 'border-0 focus:ring-2 focus:ring-primary/30 shadow-[0_0_0_1px_rgba(0,212,255,0.1)]';

  // Combine classes
  const selectClasses = `${baseStyles} ${borderStyles} ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm font-medium text-white">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          className={selectClasses}
          disabled={disabled}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option, index) => (
            <option
              key={option.value || index}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom Arrow Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-dark pointer-events-none">
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>

      {/* Helper Text or Error Message */}
      {(helperText || error) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-error' : 'text-text-secondary-dark'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}
