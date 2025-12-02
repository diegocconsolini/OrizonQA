'use client';

/**
 * Cache Status Bar Component
 *
 * Always-visible status bar showing local cache state.
 * Provides quick actions and links to full cache panel.
 *
 * PRIVACY: Indicates that all data is stored locally.
 */

import { HardDrive, Database, Trash2, Eye, Shield } from 'lucide-react';

export default function CacheStatusBar({
  totalRepos = 0,
  totalFiles = 0,
  totalSize = 0,
  formatStorageSize,
  onViewCache,
  onClearAll,
  isLoading = false
}) {
  const hasCache = totalRepos > 0;

  return (
    <div className="bg-surface-dark/80 backdrop-blur-sm border-t border-white/10 px-4 py-2">
      <div className="flex items-center justify-between max-w-[1600px] mx-auto">
        {/* Left: Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-text-secondary-dark">
            <HardDrive className="w-4 h-4" />
            <span className="text-xs font-medium">Local Cache:</span>
          </div>

          {hasCache ? (
            <div className="flex items-center gap-4 text-xs">
              <span className="text-white">
                <span className="text-primary font-semibold">{totalRepos}</span>
                {' '}repos
              </span>
              <span className="text-white/30">•</span>
              <span className="text-white">
                <span className="text-primary font-semibold">{totalFiles}</span>
                {' '}files
              </span>
              <span className="text-white/30">•</span>
              <span className="text-primary font-semibold">
                {formatStorageSize?.(totalSize) || '0 B'}
              </span>
            </div>
          ) : (
            <span className="text-xs text-text-secondary-dark">Empty</span>
          )}
        </div>

        {/* Center: Privacy indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-text-secondary-dark">
          <Shield className="w-3.5 h-3.5 text-green-500" />
          <span>Your code stays on your device</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onViewCache}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                     text-text-secondary-dark hover:text-white hover:bg-white/5
                     rounded-lg transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Cache</span>
          </button>

          {hasCache && (
            <button
              onClick={onClearAll}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                       text-text-secondary-dark hover:text-red-400 hover:bg-red-500/10
                       rounded-lg transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
