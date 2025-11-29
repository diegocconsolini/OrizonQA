/**
 * ORIZON Sidebar Component
 *
 * A navigation sidebar following the ORIZON design system
 * with cosmic styling and smooth interactions.
 *
 * Features:
 * - 240px fixed width
 * - Dark background (#1A1A1A)
 * - Full height with scrollable content
 * - Header and footer sections
 * - Collapsible support
 */

'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar({
  children,
  collapsed = false,
  onToggleCollapse,
  showToggle = true,
  className = '',
  ...props
}) {
  const sidebarWidth = collapsed ? 'w-16' : 'w-60';

  return (
    <aside
      className={`h-screen bg-surface-dark border-r border-border-dark flex flex-col transition-all duration-300 ease-out ${sidebarWidth} ${className}`}
      {...props}
    >
      {children}

      {/* Collapse Toggle Button */}
      {showToggle && (
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-8 w-6 h-6 bg-surface-dark border border-border-dark rounded-full flex items-center justify-center text-text-muted-dark hover:text-primary hover:border-primary transition-colors shadow-medium"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      )}
    </aside>
  );
}

/**
 * Sidebar Header Component
 */
export function SidebarHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-6 border-b border-border-dark ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * Sidebar Content Component
 * Scrollable navigation area
 */
export function SidebarContent({ children, className = '', ...props }) {
  return (
    <nav className={`flex-1 overflow-y-auto p-4 ${className}`} {...props}>
      {children}
    </nav>
  );
}

/**
 * Sidebar Footer Component
 */
export function SidebarFooter({ children, className = '', ...props }) {
  return (
    <div className={`p-4 border-t border-border-dark ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * Sidebar Section Component
 * For grouping navigation items
 */
export function SidebarSection({ title, children, className = '', ...props }) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {title && (
        <h3 className="px-3 mb-2 text-xs font-medium text-text-muted-dark uppercase tracking-wider">
          {title}
        </h3>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}
