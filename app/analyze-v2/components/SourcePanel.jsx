'use client';

import { useState, useMemo } from 'react';
import {
  Github, FileText, Upload, Search, ChevronRight, ChevronDown,
  Folder, File, Check, Database, GitBranch
} from 'lucide-react';

/**
 * SourcePanel Component
 *
 * Left panel with repository selection and file tree browser.
 * Supports GitHub repos, paste, and file upload modes.
 */
export default function SourcePanel({
  // GitHub state
  isConnected,
  repositories,
  selectedRepo,
  onSelectRepo,
  reposLoading,
  branches,
  selectedBranch,
  onChangeBranch,
  fileTree,
  selectedFiles,
  onToggleFile,
  onBatchToggleFiles,
  onSelectAllCodeFiles,
  onClearSelection,
  filesLoading,
  cachedFilePaths,
  // Alternative modes
  codeInput,
  onCodeInputChange,
  uploadedFiles,
  onFileUpload,
  onClearUploadedFiles,
  // Token estimate
  estimatedTokens
}) {
  const [activeTab, setActiveTab] = useState('github');
  const [repoSearch, setRepoSearch] = useState('');
  const [fileSearch, setFileSearch] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set(['app', 'app/api', 'lib']));

  // Filter repositories by search
  const filteredRepos = useMemo(() => {
    if (!repoSearch) return repositories;
    const search = repoSearch.toLowerCase();
    return repositories.filter(repo =>
      repo.full_name?.toLowerCase().includes(search) ||
      repo.name?.toLowerCase().includes(search)
    );
  }, [repositories, repoSearch]);

  // Build file tree structure
  const treeStructure = useMemo(() => {
    if (!fileTree || fileTree.length === 0) return [];

    const root = [];
    const folderMap = new Map();

    fileTree.forEach(item => {
      const parts = item.path.split('/');
      let currentLevel = root;
      let currentPath = '';

      parts.forEach((part, i) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (i === parts.length - 1 && item.type === 'blob') {
          currentLevel.push({
            name: part,
            path: item.path,
            type: 'file',
            size: item.size
          });
        } else {
          let folder = folderMap.get(currentPath);
          if (!folder) {
            folder = {
              name: part,
              path: currentPath,
              type: 'folder',
              children: []
            };
            folderMap.set(currentPath, folder);
            currentLevel.push(folder);
          }
          currentLevel = folder.children;
        }
      });
    });

    return root;
  }, [fileTree]);

  // Filter files by search
  const filterTree = (items, search) => {
    if (!search) return items;
    const searchLower = search.toLowerCase();

    return items.filter(item => {
      if (item.type === 'file') {
        return item.name.toLowerCase().includes(searchLower);
      }
      const filteredChildren = filterTree(item.children || [], search);
      item.children = filteredChildren;
      return filteredChildren.length > 0 || item.name.toLowerCase().includes(searchLower);
    });
  };

  const filteredTree = useMemo(() => {
    return filterTree([...treeStructure], fileSearch);
  }, [treeStructure, fileSearch]);

  // Toggle folder expansion
  const toggleFolder = (path) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Check if file is selected
  const isFileSelected = (path) => selectedFiles.includes(path);

  // Render tree item
  const renderTreeItem = (item, depth = 0) => {
    const isExpanded = expandedFolders.has(item.path);
    const isSelected = item.type === 'file' && isFileSelected(item.path);
    const isCached = cachedFilePaths?.includes(item.path);

    return (
      <div key={item.path}>
        <div
          className={`
            flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer
            transition-colors text-xs
            ${isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-white/5'}
          `}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (item.type === 'folder') {
              toggleFolder(item.path);
            } else {
              onToggleFile(item.path);
            }
          }}
        >
          {item.type === 'folder' ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-text-secondary-dark" />
              ) : (
                <ChevronRight className="w-3 h-3 text-text-secondary-dark" />
              )}
              <Folder className="w-3.5 h-3.5 text-blue-400" />
            </>
          ) : (
            <>
              <div className="w-3 h-3" />
              <File className="w-3.5 h-3.5 text-yellow-400" />
            </>
          )}
          <span className={`flex-1 truncate ${isSelected ? 'text-white' : 'text-white/80'}`}>
            {item.name}
          </span>
          {item.type === 'folder' && item.children?.length > 0 && (
            <span className="text-[10px] text-text-secondary-dark">
              {item.children.length}
            </span>
          )}
          {item.type === 'file' && isSelected && (
            <Check className="w-3 h-3 text-primary" />
          )}
          {item.type === 'file' && isCached && (
            <Database className="w-3 h-3 text-green-400" />
          )}
        </div>
        {item.type === 'folder' && isExpanded && item.children?.map(child =>
          renderTreeItem(child, depth + 1)
        )}
      </div>
    );
  };

  // Quick select patterns
  const patterns = [
    { label: 'API', pattern: 'app/api/**/*.js' },
    { label: 'Components', pattern: 'app/components/**/*.{js,jsx}' },
    { label: 'Hooks', pattern: 'app/hooks/**/*.js' },
    { label: 'Lib', pattern: 'lib/**/*.js' },
  ];

  return (
    <div className="h-full flex flex-col border-r border-white/10">
      {/* Source Tabs */}
      <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-surface-dark/50">
        <button
          onClick={() => setActiveTab('github')}
          className={`
            flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors
            ${activeTab === 'github'
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'text-text-secondary-dark hover:text-white hover:bg-white/5'}
          `}
        >
          <Github className="w-3.5 h-3.5" />
          GitHub
        </button>
        <button
          onClick={() => setActiveTab('paste')}
          className={`
            flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors
            ${activeTab === 'paste'
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'text-text-secondary-dark hover:text-white hover:bg-white/5'}
          `}
        >
          <FileText className="w-3.5 h-3.5" />
          Paste
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`
            flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors
            ${activeTab === 'upload'
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'text-text-secondary-dark hover:text-white hover:bg-white/5'}
          `}
        >
          <Upload className="w-3.5 h-3.5" />
          Upload
        </button>
        <div className="flex-1" />
        {cachedFilePaths?.length > 0 && (
          <span className="text-[10px] text-green-400">
            {cachedFilePaths.length} cached
          </span>
        )}
      </div>

      {/* GitHub Tab */}
      {activeTab === 'github' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Repo List */}
          <div className="w-1/2 border-r border-white/10 flex flex-col">
            <div className="p-2 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary-dark" />
                <input
                  type="text"
                  placeholder="Search repos..."
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-bg-dark border border-white/10 rounded
                           text-xs text-white placeholder-text-secondary-dark
                           focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
              {!isConnected ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-text-secondary-dark mb-2">Connect GitHub to browse repos</p>
                  <a
                    href="/settings?tab=github"
                    className="text-xs text-primary hover:underline"
                  >
                    Connect GitHub
                  </a>
                </div>
              ) : reposLoading ? (
                <div className="p-4 text-center">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="p-4 text-center text-xs text-text-secondary-dark">
                  No repositories found
                </div>
              ) : (
                filteredRepos.map(repo => (
                  <div
                    key={repo.id || repo.full_name}
                    onClick={() => onSelectRepo(repo)}
                    className={`
                      flex items-center gap-2 p-2 rounded cursor-pointer transition-colors
                      ${selectedRepo?.id === repo.id
                        ? 'bg-primary/10 border border-primary/30'
                        : 'hover:bg-white/5'}
                    `}
                  >
                    <Github className="w-4 h-4 text-text-secondary-dark flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-white truncate block">
                        {repo.name}
                      </span>
                      {repo.description && (
                        <span className="text-[10px] text-text-secondary-dark truncate block">
                          {repo.description}
                        </span>
                      )}
                    </div>
                    {repo.isCached && (
                      <Database className="w-3 h-3 text-green-400 flex-shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
            {/* Branch Selector */}
            {selectedRepo && branches.length > 0 && (
              <div className="p-2 border-t border-white/10 flex items-center gap-2">
                <GitBranch className="w-3 h-3 text-text-secondary-dark" />
                <select
                  value={selectedBranch}
                  onChange={(e) => onChangeBranch(e.target.value)}
                  className="flex-1 px-2 py-1 bg-bg-dark border border-white/10 rounded
                           text-[10px] text-white focus:outline-none focus:border-primary/50"
                >
                  {branches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* File Tree */}
          <div className="w-1/2 flex flex-col">
            <div className="p-2 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-medium text-white">Files</span>
              <span className="text-[10px] text-primary">{selectedFiles.length} selected</span>
            </div>
            {/* Quick Patterns */}
            <div className="p-1.5 border-b border-white/10 flex flex-wrap gap-1">
              {patterns.map(p => (
                <button
                  key={p.label}
                  onClick={() => onBatchToggleFiles && onBatchToggleFiles(p.pattern, 'add')}
                  className="px-2 py-0.5 text-[10px] bg-white/5 text-text-secondary-dark
                           border border-white/10 rounded hover:bg-white/10 hover:text-white transition-colors"
                >
                  {p.label}
                </button>
              ))}
              {selectedFiles.length > 0 && (
                <button
                  onClick={onClearSelection}
                  className="px-2 py-0.5 text-[10px] bg-red-500/10 text-red-400
                           border border-red-500/20 rounded hover:bg-red-500/20 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            {/* File Search */}
            <div className="p-2 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary-dark" />
                <input
                  type="text"
                  placeholder="Filter files..."
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-bg-dark border border-white/10 rounded
                           text-xs text-white placeholder-text-secondary-dark
                           focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
            {/* Tree View */}
            <div className="flex-1 overflow-y-auto p-1.5">
              {filesLoading ? (
                <div className="p-4 text-center">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : !selectedRepo ? (
                <div className="p-4 text-center text-xs text-text-secondary-dark">
                  Select a repository
                </div>
              ) : filteredTree.length === 0 ? (
                <div className="p-4 text-center text-xs text-text-secondary-dark">
                  No files found
                </div>
              ) : (
                filteredTree.map(item => renderTreeItem(item))
              )}
            </div>
            {/* Token Estimate */}
            <div className="p-2 border-t border-white/10 flex items-center justify-between text-[10px]">
              <span className="text-white">~{estimatedTokens?.toLocaleString() || 0} tokens</span>
              <span className="text-primary font-medium">
                ${((estimatedTokens || 0) / 1000000 * 3).toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Paste Tab */}
      {activeTab === 'paste' && (
        <div className="flex-1 flex flex-col p-3">
          <textarea
            value={codeInput}
            onChange={(e) => onCodeInputChange(e.target.value)}
            placeholder="Paste your code here..."
            className="flex-1 w-full p-3 bg-bg-dark border border-white/10 rounded-lg
                     text-xs text-white font-mono placeholder-text-secondary-dark
                     focus:outline-none focus:border-primary/50 resize-none"
          />
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="text-text-secondary-dark">
              {codeInput.length.toLocaleString()} characters
            </span>
            <span className="text-primary">
              ~{Math.ceil(codeInput.length / 4).toLocaleString()} tokens
            </span>
          </div>
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="flex-1 flex flex-col p-3">
          <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed
                         border-white/10 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
            <Upload className="w-8 h-8 text-text-secondary-dark mb-2" />
            <span className="text-xs text-text-secondary-dark">
              Drop files here or click to upload
            </span>
            <span className="text-[10px] text-text-secondary-dark mt-1">
              .js, .jsx, .ts, .tsx, .py, .java, .zip
            </span>
            <input
              type="file"
              multiple
              accept=".js,.jsx,.ts,.tsx,.py,.java,.go,.rs,.zip"
              onChange={onFileUpload}
              className="hidden"
            />
          </label>
          {uploadedFiles?.length > 0 && (
            <div className="mt-3 space-y-1">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded text-xs">
                  <File className="w-3 h-3 text-yellow-400" />
                  <span className="flex-1 truncate text-white">{file.name}</span>
                  <span className="text-text-secondary-dark">{(file.size / 1024).toFixed(1)}KB</span>
                </div>
              ))}
              <button
                onClick={onClearUploadedFiles}
                className="w-full py-1 text-[10px] text-red-400 hover:text-red-300"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
