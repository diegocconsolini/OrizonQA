/**
 * ORIZON Empty State Component
 *
 * An empty state component following the ORIZON design system
 * for displaying when there's no data or content.
 *
 * Features:
 * - Centered layout with cosmic styling
 * - Icon/illustration support
 * - Title and description
 * - Optional action button
 * - Multiple variants for different contexts
 */

import Button from './Button';

export default function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  variant = 'default',
  className = '',
  ...props
}) {
  // Variant styles for icon container
  const variants = {
    default: 'bg-primary/10 text-primary shadow-glow-primary/20',
    accent: 'bg-accent/10 text-accent shadow-glow-accent/20',
    neutral: 'bg-surface-hover-dark text-text-muted-dark',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}
      {...props}
    >
      {/* Icon Container */}
      {icon && (
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border ${variants[variant]}`}
        >
          {icon}
        </div>
      )}

      {/* Title */}
      {title && (
        <h3 className="text-lg font-primary font-semibold text-white mb-2">
          {title}
        </h3>
      )}

      {/* Description */}
      {description && (
        <p className="text-sm text-text-secondary-dark max-w-md mb-6">
          {description}
        </p>
      )}

      {/* Action Button */}
      {(action || (actionLabel && onAction)) && (
        <div>
          {action || (
            <Button onClick={onAction} variant="primary">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Empty State variants for common use cases
 */

// No Results
export function NoResults({ searchTerm, onClear }) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      title="No results found"
      description={
        searchTerm
          ? `We couldn't find anything matching "${searchTerm}". Try adjusting your search.`
          : "We couldn't find any results. Try adjusting your filters."
      }
      actionLabel={onClear ? "Clear search" : undefined}
      onAction={onClear}
      variant="default"
    />
  );
}

// No Data
export function NoData({ onCreate, createLabel = "Create new" }) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      }
      title="Nothing here yet"
      description="Get started by creating your first item."
      actionLabel={createLabel}
      onAction={onCreate}
      variant="default"
    />
  );
}

// Error State
export function ErrorState({ onRetry, message }) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      }
      title="Something went wrong"
      description={message || "We encountered an error loading this content. Please try again."}
      actionLabel="Try again"
      onAction={onRetry}
      variant="accent"
    />
  );
}

// Coming Soon
export function ComingSoon({ feature }) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      }
      title="Coming Soon"
      description={
        feature
          ? `${feature} is on the way! Stay tuned for updates.`
          : "This feature is currently under development. Check back soon!"
      }
      variant="default"
    />
  );
}
