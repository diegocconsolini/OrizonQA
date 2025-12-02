'use client';

/**
 * Local Cache Panel Component
 *
 * Full transparency view of all locally cached repository data.
 * Two modes: Simple (quick overview) and Advanced (full file browser).
 *
 * PRIVACY: All data shown is stored ONLY in IndexedDB on user's device.
 * No data is ever uploaded to ORIZON servers.
 */

import { useState, useEffect } from 'react';
import {
  HardDrive,
  FolderOpen,
  File,
  Trash2,
  ChevronDown,
  ChevronRight,
  Database,
  Shield,
  Clock,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  X,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  FileCode
} from 'lucide-react';

export default function LocalCachePanel({
  cacheManifest = [],
  storageStats = null,
  onRemoveRepo,
  onClearAll,
  formatStorageSize,
  isLoading = false,
  onRefresh
}) {
  const [viewMode, setViewMode] = useState('simple'); // 'simple' | 'advanced'
  const [expandedRepos, setExpandedRepos] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmDeleteRepo, setConfirmDeleteRepo] = useState(null);

  // Filter repos by search
  const filteredRepos = cacheManifest.filter(repo => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      repo.name?.toLowerCase().includes(term) ||
      repo.owner?.toLowerCase().includes(term) ||
      repo.full_name?.toLowerCase().includes(term)
    );
  });

  // Toggle repo expansion
  const toggleRepo = (repoId) => {
    setExpandedRepos(prev => {
      const next = new Set(prev);
      if (next.has(repoId)) {
        next.delete(repoId);
      } else {
        next.add(repoId);
      }
      return next;
    });
  };

  // Calculate totals
  const totalSize = cacheManifest.reduce((sum, r) => sum + (r.totalSize || 0), 0);
  const totalFiles = cacheManifest.reduce((sum, r) => sum + (r.fileCount || 0), 0);
  const totalRepos = cacheManifest.length;

  // Handle repo deletion
  const handleDeleteRepo = async (repo) => {
    if (confirmDeleteRepo === repo.repoId) {
      await onRemoveRepo?.(repo.owner, repo.name);
      setConfirmDeleteRepo(null);
    } else {
      setConfirmDeleteRepo(repo.repoId);
      // Auto-reset after 3 seconds
      setTimeout(() => setConfirmDeleteRepo(null), 3000);
    }
  };

  // Handle clear all
  const handleClearAll = async () => {
    if (confirmClearAll) {
      await onClearAll?.();
      setConfirmClearAll(false);
    } else {
      setConfirmClearAll(true);
      setTimeout(() => setConfirmClearAll(false), 3000);
    }
  };

  return (
    <div className="bg-surface-dark rounded-2xl overflow-hidden border border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-bg-dark/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <HardDrive className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Local Cache</h3>
              <p className="text-xs text-text-secondary-dark flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Stored only on your device
              </p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('simple')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                viewMode === 'simple'
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-text-secondary-dark hover:text-white hover:bg-white/5'
              }`}
            >
              Simple
            </button>
            <button
              onClick={() => setViewMode('advanced')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                viewMode === 'advanced'
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-text-secondary-dark hover:text-white hover:bg-white/5'
              }`}
            >
              Advanced
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-bg-dark rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{totalRepos}</p>
            <p className="text-xs text-text-secondary-dark">Repositories</p>
          </div>
          <div className="bg-bg-dark rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{totalFiles}</p>
            <p className="text-xs text-text-secondary-dark">Files</p>
          </div>
          <div className="bg-bg-dark rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary">
              {formatStorageSize?.(totalSize) || '0 B'}
            </p>
            <p className="text-xs text-text-secondary-dark">Storage Used</p>
          </div>
        </div>
      </div>

      {/* Simple Mode */}
      {viewMode === 'simple' && (
        <div className="p-4">
          {totalRepos === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-text-secondary-dark mx-auto mb-3" />
              <p className="text-white font-medium mb-1">No cached repositories</p>
              <p className="text-sm text-text-secondary-dark">
                Select files from a repository and save them to local cache
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cacheManifest.map(repo => (
                <div
                  key={repo.repoId}
                  className="flex items-center justify-between p-3 bg-bg-dark rounded-xl border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {repo.full_name || `${repo.owner}/${repo.name}`}
                      </p>
                      <p className="text-xs text-text-secondary-dark">
                        {repo.fileCount} files • {formatStorageSize?.(repo.totalSize)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRepo(repo)}
                    className={`p-2 rounded-lg transition-all ${
                      confirmDeleteRepo === repo.repoId
                        ? 'bg-red-500/20 text-red-400'
                        : 'hover:bg-white/5 text-text-secondary-dark hover:text-red-400'
                    }`}
                    title={confirmDeleteRepo === repo.repoId ? 'Click again to confirm' : 'Remove from cache'}
                  >
                    {confirmDeleteRepo === repo.repoId ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Advanced Mode */}
      {viewMode === 'advanced' && (
        <div className="p-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary-dark" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search repositories..."
              className="w-full pl-10 pr-4 py-2 bg-bg-dark border border-white/10 rounded-xl
                       text-sm text-white placeholder-text-secondary-dark
                       focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-dark hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {filteredRepos.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-text-secondary-dark mx-auto mb-3" />
              <p className="text-white font-medium mb-1">
                {searchTerm ? 'No matching repositories' : 'No cached repositories'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredRepos.map(repo => (
                <div
                  key={repo.repoId}
                  className="bg-bg-dark rounded-xl border border-white/5 overflow-hidden"
                >
                  {/* Repo Header */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5"
                    onClick={() => toggleRepo(repo.repoId)}
                  >
                    <div className="flex items-center gap-3">
                      <button className="p-1">
                        {expandedRepos.has(repo.repoId) ? (
                          <ChevronDown className="w-4 h-4 text-text-secondary-dark" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-text-secondary-dark" />
                        )}
                      </button>
                      <FolderOpen className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium text-white">
                          {repo.full_name || `${repo.owner}/${repo.name}`}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-text-secondary-dark">
                          <span className="flex items-center gap-1">
                            <FileCode className="w-3 h-3" />
                            {repo.fileCount} files
                          </span>
                          <span>{formatStorageSize?.(repo.totalSize)}</span>
                          {repo.branches?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              {repo.branches.length} branches
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteRepo(repo); }}
                      className={`p-2 rounded-lg transition-all ${
                        confirmDeleteRepo === repo.repoId
                          ? 'bg-red-500/20 text-red-400'
                          : 'hover:bg-white/5 text-text-secondary-dark hover:text-red-400'
                      }`}
                    >
                      {confirmDeleteRepo === repo.repoId ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Expanded File List */}
                  {expandedRepos.has(repo.repoId) && repo.files?.length > 0 && (
                    <div className="border-t border-white/5 p-3 bg-surface-dark/50">
                      <div className="max-h-[200px] overflow-y-auto space-y-1">
                        {repo.files.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between py-1.5 px-2 hover:bg-white/5 rounded-lg text-xs"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <File className="w-3.5 h-3.5 text-text-secondary-dark flex-shrink-0" />
                              <span className="text-white truncate">{file.path}</span>
                            </div>
                            <div className="flex items-center gap-3 text-text-secondary-dark flex-shrink-0">
                              <span>{formatStorageSize?.(file.size)}</span>
                              {file.branch && (
                                <span className="px-1.5 py-0.5 bg-white/5 rounded text-[10px]">
                                  {file.branch}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="p-4 border-t border-white/10 bg-bg-dark/50">
        <div className="flex items-center justify-between">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary-dark
                     hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {totalRepos > 0 && (
            <button
              onClick={handleClearAll}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                confirmClearAll
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-white/5 text-text-secondary-dark hover:text-red-400 hover:bg-red-500/10'
              }`}
            >
              {confirmClearAll ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Click again to confirm
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Clear All Cache
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
