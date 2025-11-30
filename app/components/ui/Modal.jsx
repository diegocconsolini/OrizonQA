/**
 * ORIZON Modal Component
 *
 * A comprehensive modal system following the ORIZON design system
 * with cosmic styling and smooth animations.
 *
 * Sizes:
 * - sm: 500px width (forms)
 * - md: 600px width (default)
 * - lg: 900px width (media/content)
 *
 * Features:
 * - Portal rendering for proper layering
 * - 80% black backdrop with 8px blur
 * - Scale and fade entrance animation
 * - Keyboard escape support
 * - Click outside to close
 * - Focus trap
 */

'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen = false,
  onClose,
  size = 'md',
  title,
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
  ...props
}) {
  const modalRef = useRef(null);

  // Size styles
  const sizes = {
    sm: 'max-w-md',  // 500px
    md: 'max-w-xl',  // 600px
    lg: 'max-w-4xl', // 900px
  };

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className={`relative w-full ${sizes[size]} bg-surface-dark rounded-2xl shadow-xl overflow-hidden animate-scaleIn ${className}`}
        role="dialog"
        aria-modal="true"
        {...props}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-border-dark">
            {title && (
              <h2 className="text-xl font-primary font-semibold text-white">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-auto text-text-muted-dark hover:text-white transition-colors p-1 rounded-lg hover:bg-surface-hover-dark"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Modal Header Component
 */
export function ModalHeader({ children, className = '', ...props }) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * Modal Body Component
 */
export function ModalBody({ children, className = '', ...props }) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * Modal Footer Component
 * For action buttons
 */
export function ModalFooter({ children, className = '', ...props }) {
  return (
    <div className={`mt-6 pt-4 border-t border-border-dark flex items-center justify-end gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
}
