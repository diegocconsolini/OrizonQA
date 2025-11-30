/**
 * ORIZON Input Component
 *
 * A comprehensive input component following the ORIZON design system
 * with dark theme styling and cosmic focus effects.
 *
 * Features:
 * - Dark surface background (#1A1A1A)
 * - Event Horizon Blue focus ring
 * - 44px height (default)
 * - Optional label and helper text
 * - Error state support
 * - Icon support (prefix/suffix)
 */

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({
  type = 'text',
  label,
  helperText,
  error,
  icon,
  iconPosition = 'left',
  disabled = false,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Determine actual input type (handle password visibility toggle)
  const actualType = type === 'password' && showPassword ? 'text' : type;

  // Base input styles
  const baseStyles = 'w-full h-11 px-4 bg-surface-dark border rounded-lg font-secondary text-base text-white placeholder:text-text-muted-dark transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed';

  // Border styles (normal, focused, error) - borderless Interstellar style
  const borderStyles = error
    ? 'border-0 focus:ring-2 focus:ring-error/30 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]'
    : 'border-0 focus:ring-2 focus:ring-primary/30 shadow-[0_0_0_1px_rgba(0,212,255,0.1)]';

  // Icon padding adjustments
  const iconPaddingStyles = icon
    ? iconPosition === 'left'
      ? 'pl-11'
      : 'pr-11'
    : '';

  // Password toggle padding
  const passwordPaddingStyles = type === 'password' ? 'pr-11' : '';

  // Combine classes
  const inputClasses = `${baseStyles} ${borderStyles} ${iconPaddingStyles} ${passwordPaddingStyles} ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm font-medium text-white">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Prefix Icon */}
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-dark">
            {icon}
          </div>
        )}

        {/* Input Field */}
        <input
          type={actualType}
          className={inputClasses}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {/* Suffix Icon */}
        {icon && iconPosition === 'right' && !type === 'password' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-dark">
            {icon}
          </div>
        )}

        {/* Password Toggle */}
        {type === 'password' && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-dark hover:text-primary transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
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
