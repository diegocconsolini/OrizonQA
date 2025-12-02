'use client';

/**
 * Privacy Notice Component
 *
 * Clearly communicates to users that their code stays local.
 * Shows IndexedDB storage status and provides cache management.
 *
 * Key Messages:
 * - Your Code Stays Local
 * - NO cloud storage of your code
 * - Data stored only on YOUR device
 * - Clear cache anytime
 *
 * This is a CRITICAL component for user trust.
 */

import { useState } from 'react';
import {
  Shield,
  Database,
  Trash2,
  HardDrive,
  Lock,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function PrivacyNotice({
  storageStats = null,
  onClearCache,
  onCleanupOldData,
  formatStorageSize,
  isLoading = false,
  compact = false
}) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [clearing, setClearing] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClearCache = async () => {
    setClearing(true);
    try {
      await onClearCache?.();
    } finally {
      setClearing(false);
      setShowConfirm(false);
    }
  };

  const handleCleanup = async () => {
    setCleaningUp(true);
    try {
      await onCleanupOldData?.(30); // Clean data older than 30 days
    } finally {
      setCleaningUp(false);
    }
  };

  // Compact banner version
  if (compact && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full p-3 bg-primary/5 border border-primary/10 rounded-lg
                 flex items-center justify-between gap-3 transition-all duration-200
                 hover:bg-primary/10 hover:border-primary/20"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-white">
            Your Code Stays Local
          </span>
          <span className="text-xs text-text-secondary-dark">
            No cloud storage
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-text-secondary-dark" />
      </button>
    );
  }

  return (
    <div className="bg-surface-dark border border-primary/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Your Code Stays Local
              </h3>
              <p className="text-xs text-text-secondary-dark mt-0.5">
                Privacy-first architecture
              </p>
            </div>
          </div>
          {compact && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ChevronUp className="w-4 h-4 text-text-secondary-dark" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Privacy Features */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2.5 p-3 bg-white/5 rounded-lg">
            <div className="p-1.5 bg-green-500/10 rounded">
              <HardDrive className="w-3.5 h-3.5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Local Storage Only</p>
              <p className="text-xs text-text-secondary-dark mt-0.5">
                Data stays on YOUR device
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 bg-white/5 rounded-lg">
            <div className="p-1.5 bg-red-500/10 rounded">
              <X className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">No Cloud Upload</p>
              <p className="text-xs text-text-secondary-dark mt-0.5">
                Code never leaves your browser
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 bg-white/5 rounded-lg">
            <div className="p-1.5 bg-blue-500/10 rounded">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">You're in Control</p>
              <p className="text-xs text-text-secondary-dark mt-0.5">
                Clear cache anytime
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 bg-white/5 rounded-lg">
            <div className="p-1.5 bg-amber-500/10 rounded">
              <Database className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Offline Access</p>
              <p className="text-xs text-text-secondary-dark mt-0.5">
                Works without internet
              </p>
            </div>
          </div>
        </div>

        {/* Storage Stats */}
        {storageStats && (
          <div className="p-3 bg-bg-dark rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-secondary-dark uppercase tracking-wider">
                Cache Status
              </span>
              {isLoading && (
                <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-lg font-semibold text-white">
                  {storageStats.repositories}
                </p>
                <p className="text-xs text-text-secondary-dark">Repositories</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">
                  {storageStats.files}
                </p>
                <p className="text-xs text-text-secondary-dark">Files</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">
                  {formatStorageSize?.(storageStats.totalSize) || '0 B'}
                </p>
                <p className="text-xs text-text-secondary-dark">Total Size</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!showConfirm ? (
            <>
              <button
                onClick={handleCleanup}
                disabled={cleaningUp || !storageStats?.files}
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg
                         text-sm text-text-secondary-dark font-medium
                         hover:bg-white/10 hover:text-white transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
              >
                {cleaningUp ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Clean Old Data
              </button>

              <button
                onClick={() => setShowConfirm(true)}
                disabled={!storageStats?.files}
                className="flex-1 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg
                         text-sm text-red-400 font-medium
                         hover:bg-red-500/20 transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Cache
              </button>
            </>
          ) : (
            <div className="flex-1 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400 mb-3">
                This will delete all cached repository data. Are you sure?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-3 py-1.5 bg-white/5 rounded text-sm text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearCache}
                  disabled={clearing}
                  className="flex-1 px-3 py-1.5 bg-red-500 rounded text-sm text-white font-medium
                           hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {clearing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    'Delete All'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-3 bg-bg-dark/50 border-t border-white/5">
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-text-secondary-dark flex-shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary-dark">
            Repository content is stored in your browser's IndexedDB. Only metadata
            is sent to ORIZON for analysis - your actual code stays in your browser.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact inline privacy badge for tight spaces
 */
export function PrivacyBadge({ className = '' }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10
                    border border-primary/20 rounded-full ${className}`}>
      <Shield className="w-3 h-3 text-primary" />
      <span className="text-xs font-medium text-primary">Local Only</span>
    </div>
  );
}
