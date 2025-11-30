'use client';

import { useRef, useState, useEffect } from 'react';

/**
 * VerificationCodeInput Component
 *
 * A 6-digit verification code input with auto-focus progression.
 * Each digit has its own input field for better UX.
 *
 * Features:
 * - Auto-focus next input on digit entry
 * - Auto-focus previous input on backspace
 * - Paste support (auto-fills all digits)
 * - Only allows numeric input
 * - Visual feedback for focused/filled states
 * - Callback when all 6 digits are entered
 *
 * @param {Function} onComplete - Called with full code when all 6 digits entered
 * @param {Function} onChange - Called whenever code changes
 * @param {boolean} disabled - Disable all inputs
 * @param {string} error - Error message to display
 */
export default function VerificationCodeInput({
  onComplete,
  onChange,
  disabled = false,
  error = ''
}) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  // Handle input change
  const handleChange = (index, value) => {
    // Only allow numeric input
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Notify parent of change
    if (onChange) {
      onChange(newCode.join(''));
    }

    // Auto-focus next input if value entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if all digits entered
    if (newCode.every(digit => digit !== '')) {
      if (onComplete) {
        onComplete(newCode.join(''));
      }
    }
  };

  // Handle keydown events
  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        // If current input is empty, focus previous and clear it
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();

        if (onChange) {
          onChange(newCode.join(''));
        }
      } else if (code[index]) {
        // If current input has value, just clear it
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);

        if (onChange) {
          onChange(newCode.join(''));
        }
      }
      e.preventDefault();
    }

    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    // Only accept 6-digit numeric strings
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setCode(digits);

      if (onChange) {
        onChange(pastedData);
      }

      // Focus last input
      inputRefs.current[5]?.focus();

      // Trigger onComplete
      if (onComplete) {
        onComplete(pastedData);
      }
    }
  };

  // Handle focus - select all content
  const handleFocus = (index) => {
    inputRefs.current[index]?.select();
  };

  // Reset code (exposed via ref if needed)
  useEffect(() => {
    // Auto-focus first input on mount
    if (!disabled) {
      inputRefs.current[0]?.focus();
    }
  }, [disabled]);

  return (
    <div className="space-y-2">
      <div className="flex gap-3 justify-center">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(index)}
            disabled={disabled}
            className={`
              w-12 h-14 text-center text-2xl font-bold
              bg-surface-dark border-2 rounded-lg
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary/30
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error
                ? 'border-red-500 text-red-400'
                : digit
                  ? 'border-primary text-white'
                  : 'border-white/10 text-text-secondary-dark hover:border-white/20'
              }
            `}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-400 text-center mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
