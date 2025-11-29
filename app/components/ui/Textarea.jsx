/**
 * ORIZON Textarea Component
 *
 * A textarea component following the ORIZON design system
 * with dark theme styling and cosmic focus effects.
 *
 * Features:
 * - Dark surface background (#1A1A1A)
 * - Event Horizon Blue focus ring
 * - Min 120px height, resizable
 * - Optional label and helper text
 * - Error state support
 * - Monospace font for code input
 */

export default function Textarea({
  label,
  helperText,
  error,
  disabled = false,
  rows = 5,
  resize = true,
  monospace = false,
  className = '',
  ...props
}) {
  // Base textarea styles
  const baseStyles = 'w-full px-4 py-3 bg-surface-dark border rounded-lg text-base text-white placeholder:text-text-muted-dark transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed';

  // Border styles (normal, focused, error)
  const borderStyles = error
    ? 'border-error focus:border-error focus:ring-2 focus:ring-error/50'
    : 'border-border-dark focus:border-primary focus:ring-2 focus:ring-primary/50';

  // Font styles
  const fontStyles = monospace ? 'font-mono' : 'font-secondary';

  // Resize control
  const resizeStyles = resize ? 'resize-y' : 'resize-none';

  // Combine classes
  const textareaClasses = `${baseStyles} ${borderStyles} ${fontStyles} ${resizeStyles} ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm font-medium text-white">
          {label}
        </label>
      )}

      <textarea
        className={textareaClasses}
        disabled={disabled}
        rows={rows}
        style={{ minHeight: '120px' }}
        {...props}
      />

      {/* Helper Text or Error Message */}
      {(helperText || error) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-error' : 'text-text-secondary-dark'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}
