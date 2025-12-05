'use client';

/**
 * Git Input Section Component
 *
 * Primary input method for the analyze page - Git-first workflow.
 * Integrates RepositorySelector, BranchSelector, and FileFolderPicker.
 *
 * This replaces the old URL-based GitHub input with a repository browser.
 *
 * PRIVACY: All code is stored locally in IndexedDB.
 * NO code is ever uploaded to ORIZON servers.
 */

import { useState } from 'react';
import {
  Github,
  FileText,
  Upload,
  Code,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Zap,
  Settings,
  Check,
  Edit3
} from 'lucide-react';
import RepositorySelector from './RepositorySelector';
import FileFolderPicker from './FileFolderPicker';
import BranchSelector from './BranchSelector';
import { PrivacyBadge } from './PrivacyNotice';

export default function GitInputSection({
  // Repository state from useRepositories
  isConnected = false,
  repositories = [],
  selectedRepo = null,
  onSelectRepo,
  onRefreshRepos,
  reposLoading = false,
  reposError = null,

  // Branch state
  branches = [],
  selectedBranch = 'main',
  onChangeBranch,

  // File tree state
  fileTree = [],
  selectedFiles = [],
  onToggleFile,
  onBatchToggleFiles,
  onSelectAllCodeFiles,
  onSelectByPattern,
  onClearSelection,
  filesLoading = false,

  // Cache state
  cachedRepos = [],
  onSaveToCache,
  isSavingCache = false,
  cachedFiles = [],

  // Alternative input modes
  codeInput = '',
  onCodeInputChange,
  uploadedFiles = [],
  onFileUpload,
  onClearUploadedFiles,
  onDrop,

  // Token estimate
  estimatedTokens = 0,
  isTruncated = false,

  // Compact mode - hide file picker, show summary
  compactMode = false,
  selectedGoal = null
}) {
  const [inputMode, setInputMode] = useState('github'); // github, paste, upload
  const [isDragging, setIsDragging] = useState(false);
  const [showRepoSelector, setShowRepoSelector] = useState(true); // Always start expanded
  const [showFilePicker, setShowFilePicker] = useState(!compactMode); // Hide in compact mode

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    onDrop?.(e);
  };

  const handleFileSelect = (e) => {
    onFileUpload?.(e);
  };

  return (
    <div className="bg-surface-dark border border-white/10 rounded-xl overflow-hidden">
      {/* Input Mode Tabs */}
      <div className="flex items-center gap-2 p-4 border-b border-white/10 bg-bg-dark/50">
        <button
          onClick={() => setInputMode('github')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            inputMode === 'github'
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'text-text-secondary-dark hover:text-white hover:bg-white/5'
          }`}
        >
          <Github className="w-4 h-4" />
          GitHub Repository
          {isConnected && (
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setInputMode('paste')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            inputMode === 'paste'
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'text-text-secondary-dark hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4" />
          Paste Code
        </button>

        <button
          onClick={() => setInputMode('upload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            inputMode === 'upload'
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'text-text-secondary-dark hover:text-white hover:bg-white/5'
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload Files
        </button>

        <div className="flex-1" />

        <PrivacyBadge />
      </div>

      {/* Content based on input mode */}
      <div className="p-6">
        {/* GitHub Repository Mode */}
        {inputMode === 'github' && (
          <div className="space-y-6">
            {!isConnected ? (
              // Not connected state
              <div className="text-center py-16">
                <div className="p-5 bg-white/5 rounded-2xl inline-block mb-5">
                  <Github className="w-14 h-14 text-text-secondary-dark" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Connect GitHub to Get Started
                </h3>
                <p className="text-sm text-text-secondary-dark max-w-lg mx-auto mb-8">
                  Connect your GitHub account to browse and select repositories for analysis.
                  Your code stays local - we never upload it to our servers.
                </p>
                <a
                  href="/settings?tab=integrations"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-bg-dark
                           rounded-xl font-semibold hover:bg-primary/90 transition-all duration-200"
                >
                  <Settings className="w-4 h-4" />
                  Connect in Settings
                </a>
              </div>
            ) : (
              // Connected - show repo browser
              <>
                {/* Selected repo header - shown when repo is selected */}
                {selectedRepo && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Code className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-white">
                          {selectedRepo.full_name || `${selectedRepo.owner}/${selectedRepo.name}`}
                        </p>
                        <p className="text-sm text-text-secondary-dark mt-0.5">
                          {selectedRepo.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <BranchSelector
                        branches={branches}
                        selectedBranch={selectedBranch}
                        onChangeBranch={onChangeBranch}
                      />
                      <button
                        onClick={() => setShowRepoSelector(!showRepoSelector)}
                        className="px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg font-medium transition-colors"
                      >
                        {showRepoSelector ? 'Hide Repos' : 'Change Repo'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Main content grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Repository Selection - Left side */}
                  {(showRepoSelector || !selectedRepo) && (
                    <div className="min-h-[400px]">
                      <RepositorySelector
                        repositories={repositories}
                        selectedRepo={selectedRepo}
                        onSelect={(repo) => {
                          onSelectRepo(repo);
                          // Keep selector open for better UX
                        }}
                        onRefresh={onRefreshRepos}
                        loading={reposLoading}
                        isConnected={isConnected}
                        cachedRepos={cachedRepos}
                        error={reposError}
                      />
                    </div>
                  )}

                  {/* File Selection - Right side (or full width if repo selector hidden) */}
                  <div className={`${!showRepoSelector && selectedRepo ? 'xl:col-span-2' : ''}`}>
                    {/* Compact mode: Show summary when goal is selected */}
                    {compactMode && selectedGoal && selectedGoal.id !== 'custom' && selectedFiles.length > 0 && !showFilePicker ? (
                      <div className="bg-bg-dark/50 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-400" />
                            <span className="text-sm font-medium text-white">
                              {selectedFiles.length} files selected
                            </span>
                            <span className="text-xs text-text-secondary-dark">
                              ({selectedGoal.name})
                            </span>
                          </div>
                          <button
                            onClick={() => setShowFilePicker(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit selection
                          </button>
                        </div>
                        <div className="text-xs text-text-secondary-dark">
                          Files auto-selected based on your goal. Click "Edit selection" to customize.
                        </div>
                      </div>
                    ) : (
                      /* Full file picker */
                      <div className="min-h-[400px]">
                        {compactMode && showFilePicker && (
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-white">File Selection</span>
                            <button
                              onClick={() => setShowFilePicker(false)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary-dark hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                              Collapse
                            </button>
                          </div>
                        )}
                        <FileFolderPicker
                          fileTree={fileTree}
                          selectedFiles={selectedFiles}
                          onToggleFile={onToggleFile}
                          onBatchToggleFiles={onBatchToggleFiles}
                          onSelectAllCodeFiles={onSelectAllCodeFiles}
                          onSelectByPattern={onSelectByPattern}
                          onClearSelection={onClearSelection}
                          onSaveToCache={onSaveToCache}
                          isSavingCache={isSavingCache}
                          cachedFiles={cachedFiles}
                          loading={filesLoading}
                          selectedRepo={selectedRepo}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Paste Code Mode */}
        {inputMode === 'paste' && (
          <div>
            <textarea
              value={codeInput}
              onChange={(e) => onCodeInputChange?.(e.target.value)}
              placeholder={`Paste your code or multiple files here...

You can paste multiple files with separators like:
=== FILE: example.py ===
def hello():
    print('Hello!')

=== FILE: utils.py ===
def helper():
    pass`}
              className="w-full h-[500px] bg-bg-dark border border-white/10 rounded-xl p-5
                       text-sm font-mono text-white placeholder-text-secondary-dark
                       resize-none focus:outline-none focus:border-primary/50
                       focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        )}

        {/* Upload Files Mode */}
        {inputMode === 'upload' && (
          <div>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ${
                isDragging
                  ? 'border-primary bg-primary/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <div className={`mx-auto mb-4 p-4 rounded-2xl inline-block transition-colors ${
                isDragging ? 'bg-primary/20' : 'bg-white/5'
              }`}>
                <Upload className={`${isDragging ? 'text-primary' : 'text-text-secondary-dark'}`} size={32} />
              </div>
              <p className="text-white mb-2 font-medium">Drag & drop files here</p>
              <p className="text-xs text-text-secondary-dark mb-4 max-w-md mx-auto">
                Accepts: .zip, .txt, .md, .json, .py, .js, .ts, .jsx, .tsx, .java, .cs, .go, .rb, .html, .css
              </p>
              <label className="inline-block px-5 py-2.5 bg-white/5 border border-white/10
                              hover:bg-white/10 rounded-xl cursor-pointer transition-colors
                              text-sm font-medium text-white">
                Browse Files
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".zip,.txt,.md,.json,.py,.js,.ts,.jsx,.tsx,.java,.cs,.go,.rb,.html,.css,.sql,.yml,.yaml,.xml,.sh"
                />
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-4 p-4 bg-bg-dark rounded-xl border border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-white font-medium">
                    {uploadedFiles.length} file(s) loaded
                  </span>
                  <button
                    onClick={onClearUploadedFiles}
                    className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 py-1 text-sm text-text-secondary-dark"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span className="truncate">{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Token Estimate Footer */}
      <div className="px-4 py-3 border-t border-white/10 bg-bg-dark/50 flex items-center gap-2">
        <Zap size={14} className="text-amber-500" />
        <span className="text-sm text-text-secondary-dark">
          Estimated tokens: ~{estimatedTokens.toLocaleString()}
        </span>
        {isTruncated && (
          <span className="text-amber-400 text-sm ml-2">
            (Will be truncated at 100k chars)
          </span>
        )}
        {inputMode === 'github' && selectedFiles.length > 0 && (
          <span className="text-primary text-sm ml-auto">
            {selectedFiles.length} files selected
          </span>
        )}
      </div>
    </div>
  );
}
