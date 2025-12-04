'use client';

/**
 * File/Folder Picker Component
 *
 * Interactive tree view for selecting files from a GitHub repository.
 * Supports multi-select with checkboxes and pattern-based selection.
 *
 * Features:
 * - Expandable/collapsible folder tree
 * - Checkboxes for multi-selection
 * - "Select All Code Files" button
 * - "Select by Pattern" input (glob-like)
 * - File size display
 * - Language-based file icons
 *
 * PRIVACY: File contents are fetched from GitHub and stored locally
 * in IndexedDB. NO code is ever uploaded to ORIZON servers.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Check,
  Square,
  CheckSquare,
  MinusSquare,
  Code,
  FileText,
  FileJson,
  FileCode,
  Braces,
  Hash,
  Wand2,
  Filter,
  X,
  RefreshCw,
  Download,
  HardDrive,
  CheckCircle2,
  Loader2
} from 'lucide-react';

export default function FileFolderPicker({
  fileTree = [],
  selectedFiles = [],
  onToggleFile,
  onBatchToggleFiles,
  onSelectAllCodeFiles,
  onSelectByPattern,
  onClearSelection,
  onSaveToCache,
  isSavingCache = false,
  cachedFiles = [],
  loading = false,
  selectedRepo = null
}) {
  // Create Sets for O(1) lookups instead of O(n) array.includes()
  const selectedFilesSet = useMemo(() => new Set(selectedFiles), [selectedFiles]);
  const cachedFilesSet = useMemo(() => new Set(cachedFiles), [cachedFiles]);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['src', 'app', 'lib']));
  const [patternInput, setPatternInput] = useState('');
  const [showPatternInput, setShowPatternInput] = useState(false);

  // Get file extension icon
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconMap = {
      js: { icon: FileCode, color: 'text-yellow-500' },
      jsx: { icon: FileCode, color: 'text-cyan-500' },
      ts: { icon: FileCode, color: 'text-blue-500' },
      tsx: { icon: FileCode, color: 'text-blue-400' },
      py: { icon: FileCode, color: 'text-green-500' },
      java: { icon: FileCode, color: 'text-red-500' },
      go: { icon: FileCode, color: 'text-cyan-400' },
      rs: { icon: FileCode, color: 'text-orange-500' },
      rb: { icon: FileCode, color: 'text-red-400' },
      php: { icon: FileCode, color: 'text-purple-400' },
      cs: { icon: FileCode, color: 'text-green-400' },
      cpp: { icon: FileCode, color: 'text-pink-500' },
      c: { icon: FileCode, color: 'text-blue-300' },
      h: { icon: FileCode, color: 'text-purple-300' },
      swift: { icon: FileCode, color: 'text-orange-400' },
      kt: { icon: FileCode, color: 'text-purple-500' },
      json: { icon: FileJson, color: 'text-yellow-400' },
      yaml: { icon: Braces, color: 'text-red-300' },
      yml: { icon: Braces, color: 'text-red-300' },
      md: { icon: FileText, color: 'text-blue-200' },
      html: { icon: Code, color: 'text-orange-400' },
      css: { icon: Hash, color: 'text-blue-400' },
      scss: { icon: Hash, color: 'text-pink-400' },
      sql: { icon: FileText, color: 'text-cyan-300' },
      sh: { icon: FileText, color: 'text-green-300' },
    };
    const fileInfo = iconMap[ext] || { icon: File, color: 'text-text-secondary-dark' };
    const IconComponent = fileInfo.icon;
    return <IconComponent className={`w-4 h-4 ${fileInfo.color}`} />;
  };

  // Toggle folder expansion
  const toggleFolder = useCallback((path) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Expand all folders
  const expandAll = useCallback(() => {
    const allFolders = new Set();
    const collectFolders = (nodes) => {
      nodes.forEach(node => {
        if (node.type === 'tree' && node.children) {
          allFolders.add(node.path);
          collectFolders(node.children);
        }
      });
    };
    collectFolders(fileTree);
    setExpandedFolders(allFolders);
  }, [fileTree]);

  // Collapse all folders
  const collapseAll = useCallback(() => {
    setExpandedFolders(new Set());
  }, []);

  // Check selection state of a folder (none, some, all) - O(n) with Set lookup O(1) per file
  const getFolderSelectionState = useCallback((node) => {
    if (!node.children) return 'none';

    const getAllFilePaths = (n) => {
      if (n.type === 'blob') return [n.path];
      if (!n.children) return [];
      return n.children.flatMap(getAllFilePaths);
    };

    const allFiles = getAllFilePaths(node);
    if (allFiles.length === 0) return 'none';

    // Use Set for O(1) lookup instead of O(n) includes()
    const selectedCount = allFiles.filter(f => selectedFilesSet.has(f)).length;
    if (selectedCount === 0) return 'none';
    if (selectedCount === allFiles.length) return 'all';
    return 'some';
  }, [selectedFilesSet]);

  // Toggle folder selection (select/deselect all files in folder) - SINGLE state update
  const toggleFolderSelection = useCallback((node, e) => {
    e.stopPropagation();
    if (!node.children) return;

    const getAllFilePaths = (n) => {
      if (n.type === 'blob') return [n.path];
      if (!n.children) return [];
      return n.children.flatMap(getAllFilePaths);
    };

    const allFiles = getAllFilePaths(node);
    const state = getFolderSelectionState(node);

    // Use batch toggle for a single state update instead of N individual updates
    if (onBatchToggleFiles) {
      if (state === 'all') {
        onBatchToggleFiles(allFiles, 'remove');
      } else {
        onBatchToggleFiles(allFiles, 'add');
      }
    } else {
      // Fallback to individual toggles if batch not available
      if (state === 'all') {
        allFiles.forEach(f => {
          if (selectedFilesSet.has(f)) {
            onToggleFile(f);
          }
        });
      } else {
        allFiles.forEach(f => {
          if (!selectedFilesSet.has(f)) {
            onToggleFile(f);
          }
        });
      }
    }
  }, [selectedFilesSet, getFolderSelectionState, onToggleFile, onBatchToggleFiles]);

  // Handle pattern submission
  const handlePatternSubmit = (e) => {
    e.preventDefault();
    if (patternInput.trim()) {
      onSelectByPattern(patternInput.trim());
      setPatternInput('');
      setShowPatternInput(false);
    }
  };

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  // Count total files in tree
  const totalFiles = useMemo(() => {
    const count = (nodes) => nodes.reduce((acc, node) => {
      if (node.type === 'blob') return acc + 1;
      if (node.children) return acc + count(node.children);
      return acc;
    }, 0);
    return count(fileTree);
  }, [fileTree]);

  // Render tree node
  const renderNode = (node, depth = 0) => {
    const isFolder = node.type === 'tree';
    const isExpanded = expandedFolders.has(node.path);
    // Use Set for O(1) lookup instead of O(n) includes()
    const isSelected = selectedFilesSet.has(node.path);
    const folderState = isFolder ? getFolderSelectionState(node) : null;

    return (
      <div key={node.path}>
        <div
          className={`group flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-all duration-150 ${
            isSelected ? 'bg-primary/10' : 'hover:bg-white/5'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => isFolder ? toggleFolder(node.path) : onToggleFile(node.path)}
        >
          {/* Expand/collapse or checkbox */}
          {isFolder ? (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); toggleFolder(node.path); }}
                className="p-0.5 hover:bg-white/10 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-text-secondary-dark" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-text-secondary-dark" />
                )}
              </button>
              <button
                onClick={(e) => toggleFolderSelection(node, e)}
                className="p-0.5 hover:bg-white/10 rounded"
              >
                {folderState === 'all' ? (
                  <CheckSquare className="w-4 h-4 text-primary" />
                ) : folderState === 'some' ? (
                  <MinusSquare className="w-4 h-4 text-primary/60" />
                ) : (
                  <Square className="w-4 h-4 text-text-secondary-dark group-hover:text-white/50" />
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 ml-5">
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFile(node.path); }}
                className="p-0.5"
              >
                {isSelected ? (
                  <CheckSquare className="w-4 h-4 text-primary" />
                ) : (
                  <Square className="w-4 h-4 text-text-secondary-dark group-hover:text-white/50" />
                )}
              </button>
            </div>
          )}

          {/* Icon */}
          {isFolder ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 text-amber-500" />
            ) : (
              <Folder className="w-4 h-4 text-amber-500/70" />
            )
          ) : (
            getFileIcon(node.name)
          )}

          {/* Name */}
          <span className={`text-sm truncate flex-1 ${
            isSelected ? 'text-white' : 'text-text-secondary-dark group-hover:text-white'
          }`}>
            {node.name}
          </span>

          {/* Cache indicator - O(1) Set lookup */}
          {!isFolder && cachedFilesSet.has(node.path) && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 rounded text-xs text-green-400">
              <CheckCircle2 className="w-3 h-3" />
              cached
            </span>
          )}

          {/* File size */}
          {!isFolder && node.size > 0 && (
            <span className="text-xs text-text-secondary-dark/60">
              {formatSize(node.size)}
            </span>
          )}
        </div>

        {/* Children */}
        {isFolder && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!selectedRepo) {
    return (
      <div className="bg-surface-dark rounded-xl p-6">
        <div className="text-center py-8">
          <Folder className="w-12 h-12 text-text-secondary-dark mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Select a Repository First
          </h3>
          <p className="text-sm text-text-secondary-dark max-w-sm mx-auto">
            Choose a repository from the list to browse and select files for analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-dark rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Code className="w-4 h-4 text-primary" />
            Select Files to Analyze
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-2 py-1 text-xs text-text-secondary-dark hover:text-white hover:bg-white/5 rounded transition-all"
            >
              Expand All
            </button>
            <span className="text-white/20">|</span>
            <button
              onClick={collapseAll}
              className="px-2 py-1 text-xs text-text-secondary-dark hover:text-white hover:bg-white/5 rounded transition-all"
            >
              Collapse
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onSelectAllCodeFiles}
            className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg
                     border border-primary/20 hover:bg-primary/20 transition-all duration-200
                     flex items-center gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Select All Code Files
          </button>

          <button
            onClick={() => setShowPatternInput(!showPatternInput)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200
                      flex items-center gap-1.5 ${
              showPatternInput
                ? 'bg-accent/10 text-accent border border-accent/20'
                : 'bg-white/5 text-text-secondary-dark border border-white/10 hover:bg-white/10'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Select by Pattern
          </button>

          {selectedFiles.length > 0 && (
            <button
              onClick={onClearSelection}
              className="px-3 py-1.5 bg-white/5 text-text-secondary-dark text-xs font-medium rounded-lg
                       border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20
                       transition-all duration-200 flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Clear ({selectedFiles.length})
            </button>
          )}
        </div>

        {/* Pattern Input */}
        {showPatternInput && (
          <form onSubmit={handlePatternSubmit} className="mt-3 flex gap-2">
            <input
              type="text"
              value={patternInput}
              onChange={(e) => setPatternInput(e.target.value)}
              placeholder="e.g., src/**/*.js, **/*.test.ts"
              className="flex-1 px-3 py-2 bg-bg-dark border border-white/10 rounded-lg
                       text-white text-sm placeholder-text-secondary-dark
                       focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <button
              type="submit"
              disabled={!patternInput.trim()}
              className="px-4 py-2 bg-primary text-bg-dark text-sm font-medium rounded-lg
                       hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              Apply
            </button>
          </form>
        )}
      </div>

      {/* File Tree */}
      <div className="max-h-[350px] overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : fileTree.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="w-8 h-8 text-text-secondary-dark mx-auto mb-3" />
            <p className="text-sm text-text-secondary-dark">
              No files found in this repository
            </p>
          </div>
        ) : (
          fileTree.map(node => renderNode(node))
        )}
      </div>

      {/* Footer - Clear Action Area */}
      <div className="px-4 py-3 border-t border-white/10 bg-bg-dark/50">
        {selectedFiles.length === 0 ? (
          // No files selected - show hint
          <div className="text-center py-2">
            <p className="text-sm text-text-secondary-dark">
              Select files above to save them locally or analyze
            </p>
          </div>
        ) : (
          // Files selected - show clear action
          <div className="space-y-3">
            {/* Stats row */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary-dark">
                {selectedFiles.length} of {totalFiles} files selected
              </span>
              <span className="text-text-secondary-dark">
                {selectedFiles.filter(f => cachedFilesSet.has(f)).length} already cached
              </span>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={onSaveToCache}
              disabled={isSavingCache || selectedFiles.length === 0}
              className="w-full py-3 px-4 bg-primary text-bg-dark font-semibold rounded-xl
                       hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 flex items-center justify-center gap-2
                       shadow-lg shadow-primary/20"
            >
              {isSavingCache ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving to Local Cache...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Save {selectedFiles.length} Files to Local Cache</span>
                </>
              )}
            </button>

            {/* Secondary info */}
            <p className="text-xs text-text-secondary-dark text-center flex items-center justify-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" />
              Files are stored locally on your device - never uploaded
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
