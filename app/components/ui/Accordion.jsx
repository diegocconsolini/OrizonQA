/**
 * ORIZON Accordion Component
 *
 * A collapsible accordion component following the ORIZON design system
 * with cosmic styling and smooth animations.
 *
 * Features:
 * - Single or multiple items open at once
 * - Smooth expand/collapse animations
 * - Icon indicators
 * - Borderless Interstellar design
 * - Pure CSS animations
 */

'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Accordion({
  items = [],
  allowMultiple = false,
  defaultOpen = [],
  className = '',
  ...props
}) {
  const [openItems, setOpenItems] = useState(defaultOpen);

  const toggleItem = (index) => {
    if (allowMultiple) {
      setOpenItems((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    } else {
      setOpenItems((prev) =>
        prev.includes(index) ? [] : [index]
      );
    }
  };

  return (
    <div className={`space-y-2 ${className}`} {...props}>
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          title={item.title}
          content={item.content}
          icon={item.icon}
          isOpen={openItems.includes(index)}
          onToggle={() => toggleItem(index)}
        />
      ))}
    </div>
  );
}

/**
 * Accordion Item Component
 */
export function AccordionItem({
  title,
  content,
  icon,
  isOpen = false,
  onToggle,
  className = '',
  ...props
}) {
  return (
    <div
      className={`
        bg-surface-dark rounded-lg
        shadow-[0_0_0_1px_rgba(0,212,255,0.1)]
        overflow-hidden
        transition-all duration-200 ease-out
        ${isOpen ? 'shadow-glow-primary/30' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="
          w-full flex items-center justify-between gap-3
          p-4
          font-secondary font-medium text-white text-left
          hover:bg-surface-hover-dark
          transition-colors duration-150
        "
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 flex-1">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{title}</span>
        </div>
        <ChevronDown
          className={`
            w-5 h-5 text-primary flex-shrink-0
            transition-transform duration-200 ease-out
            ${isOpen ? 'rotate-180' : ''}
          `}
        />
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-4 pb-4 pt-0 animate-fadeIn">
          <div className="text-sm text-text-secondary-dark font-secondary">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Example usage:
 *
 * const items = [
 *   {
 *     title: 'What is ORIZON?',
 *     content: 'ORIZON is a cosmic-themed QA analysis platform...',
 *     icon: <Star className="w-5 h-5" />
 *   },
 *   {
 *     title: 'How does it work?',
 *     content: 'It uses advanced AI to analyze your codebase...'
 *   }
 * ];
 *
 * <Accordion items={items} allowMultiple defaultOpen={[0]} />
 */
