/**
 * ORIZON Toast Component
 *
 * A notification toast system following the ORIZON design system
 * with cosmic styling and smooth animations.
 *
 * Variants:
 * - success: Green notification
 * - error: Red notification
 * - warning: Orange notification
 * - info: Blue notification (default)
 *
 * Features:
 * - Auto-dismiss after duration (default 5 seconds)
 * - Close button
 * - Positioned at top-right corner
 * - Stacks multiple toasts
 * - Slide in from right animation
 * - Pure CSS animations
 */

'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export default function Toast({
  message,
  variant = 'info',
  duration = 5000,
  onClose,
  icon,
  showIcon = true,
  className = '',
  ...props
}) {
  const [isExiting, setIsExiting] = useState(false);

  // Auto-dismiss
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 200); // Wait for exit animation
  };

  // Variant styles
  const variants = {
    success: {
      bg: 'bg-success/10',
      border: 'shadow-[0_0_0_1px_rgba(16,185,129,0.3)]',
      text: 'text-success',
      icon: CheckCircle,
    },
    error: {
      bg: 'bg-error/10',
      border: 'shadow-[0_0_0_1px_rgba(239,68,68,0.3)]',
      text: 'text-error',
      icon: AlertCircle,
    },
    warning: {
      bg: 'bg-accent/10',
      border: 'shadow-[0_0_0_1px_rgba(255,149,0,0.3)]',
      text: 'text-accent',
      icon: AlertTriangle,
    },
    info: {
      bg: 'bg-primary/10',
      border: 'shadow-[0_0_0_1px_rgba(0,212,255,0.3)]',
      text: 'text-primary',
      icon: Info,
    },
  };

  const variantConfig = variants[variant];
  const IconComponent = icon || variantConfig.icon;

  return (
    <div
      className={`
        flex items-start gap-3 p-4 min-w-[320px] max-w-md
        bg-surface-dark rounded-lg
        ${variantConfig.bg} ${variantConfig.border}
        backdrop-blur-sm
        transition-all duration-200 ease-out
        ${isExiting ? 'animate-slideOutRight' : 'animate-slideInRight'}
        ${className}
      `}
      role="alert"
      {...props}
    >
      {/* Icon */}
      {showIcon && IconComponent && (
        <IconComponent className={`w-5 h-5 flex-shrink-0 ${variantConfig.text}`} />
      )}

      {/* Message */}
      <div className="flex-1 text-sm font-secondary text-white">
        {message}
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className={`flex-shrink-0 ${variantConfig.text} hover:opacity-70 transition-opacity`}
        aria-label="Close toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * Toast Container Component
 * Manages multiple toasts in a stack
 */
export function ToastContainer({ toasts = [], onRemove, position = 'top-right', className = '' }) {
  const positions = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <div
      className={`fixed ${positions[position]} z-50 flex flex-col gap-3 ${className}`}
      aria-live="polite"
    >
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id || index}
          message={toast.message}
          variant={toast.variant}
          duration={toast.duration}
          icon={toast.icon}
          showIcon={toast.showIcon}
          onClose={() => onRemove && onRemove(toast.id || index)}
        />
      ))}
    </div>
  );
}

/**
 * useToast Hook
 * For managing toast notifications programmatically
 *
 * Example usage:
 * const { showToast, toasts, removeToast } = useToast();
 * showToast({ message: 'Success!', variant: 'success' });
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = ({ message, variant = 'info', duration = 5000, icon, showIcon = true }) => {
    const id = Date.now();
    const newToast = { id, message, variant, duration, icon, showIcon };
    setToasts((prev) => [...prev, newToast]);
    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  return { toasts, showToast, removeToast, clearToasts };
}
