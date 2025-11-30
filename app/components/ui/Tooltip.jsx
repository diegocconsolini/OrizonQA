/**
 * ORIZON Tooltip Component
 *
 * A hover-triggered tooltip component following the ORIZON design system
 * with cosmic styling and smooth fade animations.
 *
 * Positions:
 * - top: Appears above the target element (default)
 * - bottom: Appears below the target element
 * - left: Appears to the left of the target element
 * - right: Appears to the right of the target element
 *
 * Features:
 * - Arrow pointer pointing to the target
 * - Max width 200px
 * - Dark background with subtle glow
 * - Fade in/out animations
 * - Pure CSS (no JavaScript positioning library)
 */

'use client';

import { useState } from 'react';

export default function Tooltip({
  children,
  content,
  position = 'top',
  delay = 0,
  className = '',
  ...props
}) {
  const [isVisible, setIsVisible] = useState(false);

  // Position styles
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  // Arrow styles
  const arrowPositions = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1',
  };

  const arrowDirections = {
    top: 'border-t-surface-dark border-x-transparent border-b-transparent',
    bottom: 'border-b-surface-dark border-x-transparent border-t-transparent',
    left: 'border-l-surface-dark border-y-transparent border-r-transparent',
    right: 'border-r-surface-dark border-y-transparent border-l-transparent',
  };

  const handleMouseEnter = () => {
    if (delay > 0) {
      setTimeout(() => setIsVisible(true), delay);
    } else {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Trigger Element */}
      {children}

      {/* Tooltip */}
      {isVisible && content && (
        <div
          className={`
            absolute z-50 px-3 py-2 max-w-[200px]
            bg-surface-dark text-white text-sm font-secondary
            rounded-lg shadow-glow-primary/30
            whitespace-normal
            animate-fadeIn
            ${positions[position]}
          `}
          role="tooltip"
        >
          {content}

          {/* Arrow */}
          <div
            className={`
              absolute w-0 h-0
              border-4
              ${arrowPositions[position]}
              ${arrowDirections[position]}
            `}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Tooltip Trigger Wrapper
 * For more complex tooltip triggers
 */
export function TooltipTrigger({ children, tooltip, position = 'top', className = '' }) {
  return (
    <Tooltip content={tooltip} position={position} className={className}>
      {children}
    </Tooltip>
  );
}
