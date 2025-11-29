/**
 * ORIZON NavItem Component
 *
 * A navigation item component following the ORIZON design system
 * for use within the Sidebar component.
 *
 * Features:
 * - 40px height
 * - 8px border radius
 * - Active state with blue glow background
 * - Icon support
 * - Badge/count indicator
 * - Smooth transitions
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

export default function NavItem({
  href,
  icon,
  children,
  badge,
  active = false,
  onClick,
  disabled = false,
  className = '',
  ...props
}) {
  // Base styles
  const baseStyles = 'flex items-center gap-3 h-10 px-3 rounded-lg font-secondary text-sm transition-all duration-200 ease-out';

  // State styles
  const stateStyles = active
    ? 'bg-primary/10 text-primary shadow-glow-primary/30 border border-primary/20'
    : disabled
    ? 'text-text-muted-dark opacity-50 cursor-not-allowed'
    : 'text-text-secondary-dark hover:bg-surface-hover-dark hover:text-white';

  // Combine classes
  const itemClasses = `${baseStyles} ${stateStyles} ${className}`;

  const content = (
    <>
      {/* Icon */}
      {icon && (
        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          {icon}
        </span>
      )}

      {/* Label */}
      <span className="flex-1 truncate">{children}</span>

      {/* Badge */}
      {badge !== undefined && badge !== null && (
        <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </>
  );

  // Render as Link or button
  if (href && !disabled) {
    return (
      <Link href={href} className={itemClasses} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button
      className={itemClasses}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {content}
    </button>
  );
}

/**
 * NavItemGroup Component
 * For collapsible navigation groups
 */
export function NavItemGroup({
  label,
  icon,
  children,
  defaultExpanded = false,
  className = '',
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={className}>
      <button
        className="flex items-center gap-3 w-full h-10 px-3 rounded-lg font-secondary text-sm text-text-secondary-dark hover:bg-surface-hover-dark hover:text-white transition-all duration-200"
        onClick={() => setExpanded(!expanded)}
      >
        {icon && (
          <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
            {icon}
          </span>
        )}
        <span className="flex-1 text-left truncate">{label}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expanded && (
        <div className="ml-8 mt-1 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}
