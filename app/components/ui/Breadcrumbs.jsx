/**
 * ORIZON Breadcrumbs Component
 *
 * A navigation breadcrumbs component following the ORIZON design system
 * with cosmic styling.
 *
 * Features:
 * - Automatic separator handling
 * - Active/current page indicator
 * - Link support
 * - Icon support
 * - Responsive text truncation
 */

'use client';

import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({
  items = [],
  separator,
  showHome = false,
  className = '',
  ...props
}) {
  const DefaultSeparator = separator || <ChevronRight className="w-4 h-4 text-text-muted-dark" />;

  return (
    <nav aria-label="Breadcrumb" className={`${className}`} {...props}>
      <ol className="flex items-center gap-2 font-secondary text-sm">
        {/* Home Icon */}
        {showHome && (
          <>
            <li>
              <a
                href="/"
                className="flex items-center text-primary hover:text-primary-hover transition-colors"
                aria-label="Home"
              >
                <Home className="w-4 h-4" />
              </a>
            </li>
            {items.length > 0 && <li aria-hidden="true">{DefaultSeparator}</li>}
          </>
        )}

        {/* Breadcrumb Items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  className="text-primary hover:text-primary-hover transition-colors truncate max-w-[150px]"
                >
                  {item.icon && <span className="mr-1.5 inline-block">{item.icon}</span>}
                  {item.label}
                </a>
              ) : (
                <span
                  className={`
                    truncate max-w-[200px]
                    ${isLast ? 'text-white font-medium' : 'text-text-secondary-dark'}
                  `}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon && <span className="mr-1.5 inline-block">{item.icon}</span>}
                  {item.label}
                </span>
              )}

              {!isLast && <span aria-hidden="true">{DefaultSeparator}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Breadcrumb Item Type
 *
 * Example usage:
 * const items = [
 *   { label: 'Dashboard', href: '/dashboard' },
 *   { label: 'Projects', href: '/projects' },
 *   { label: 'Current Project' }  // Last item (no href)
 * ];
 */
