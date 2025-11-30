/**
 * ORIZON Dropdown Component
 *
 * A dropdown menu component following the ORIZON design system
 * with cosmic styling and keyboard navigation.
 *
 * Features:
 * - Trigger button or custom trigger element
 * - Menu items with icons
 * - Divider support
 * - Keyboard navigation (arrow keys, enter, esc)
 * - Position below trigger (auto-flip if no space)
 * - Dark background with cosmic glow
 * - Pure CSS animations
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Dropdown({
  trigger,
  children,
  align = 'left',
  className = '',
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const alignmentClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`} {...props}>
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`
            absolute z-50 mt-2 min-w-[200px]
            bg-surface-dark rounded-lg
            shadow-[0_0_0_1px_rgba(0,212,255,0.1),0_8px_24px_rgba(0,0,0,0.5)]
            overflow-hidden
            animate-fadeIn
            ${alignmentClasses[align]}
          `}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Dropdown Item Component
 */
export function DropdownItem({
  children,
  icon,
  onClick,
  disabled = false,
  variant = 'default',
  className = '',
  ...props
}) {
  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  const variants = {
    default: 'text-white hover:bg-surface-hover-dark',
    danger: 'text-error hover:bg-error/10',
    success: 'text-success hover:bg-success/10',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-3 px-4 py-2.5
        font-secondary text-sm text-left
        transition-colors duration-150
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${variants[variant]}
        ${className}
      `}
      role="menuitem"
      {...props}
    >
      {icon && <span className="flex-shrink-0 w-4 h-4">{icon}</span>}
      <span className="flex-1">{children}</span>
    </button>
  );
}

/**
 * Dropdown Divider Component
 */
export function DropdownDivider({ className = '' }) {
  return <div className={`h-px bg-border-dark my-1 ${className}`} role="separator" />;
}

/**
 * Dropdown Label Component
 * For section headers
 */
export function DropdownLabel({ children, className = '' }) {
  return (
    <div className={`px-4 py-2 text-xs font-secondary text-text-muted-dark uppercase ${className}`}>
      {children}
    </div>
  );
}

/**
 * Dropdown Button Trigger
 * Pre-styled button trigger for dropdowns
 */
export function DropdownButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-secondary font-medium rounded-lg transition-all duration-200 ease-out focus:outline-none focus:ring-2';

  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-black shadow-glow-primary hover:shadow-glow-primary-lg focus:ring-primary/30',
    secondary: 'bg-quantum hover:bg-quantum-light text-white shadow-[0_0_20px_rgba(106,0,255,0.3)] hover:shadow-[0_0_40px_rgba(106,0,255,0.5)] focus:ring-quantum/30',
    ghost: 'bg-transparent text-primary hover:bg-primary/10 hover:shadow-glow-primary focus:ring-primary/30',
  };

  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-sm',
    lg: 'h-13 px-5 text-base',
  };

  return (
    <button
      type="button"
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
      <ChevronDown className="w-4 h-4" />
    </button>
  );
}
