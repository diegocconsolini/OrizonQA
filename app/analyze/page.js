'use client';

/**
 * Analyze Page - Git-First Code Analysis
 *
 * The primary code analysis interface with repository-first UX.
 * This page replaces the dashboard's analysis functionality with
 * an enhanced Git integration workflow.
 *
 * Features:
 * - GitHub OAuth integration for repository browsing
 * - File/folder picker with multi-select
 * - IndexedDB caching for offline access
 * - Privacy-first architecture (no cloud storage of code)
 * - Alternative input modes (paste, upload)
 * - Analysis configuration
 * - QA artifact generation
 *
 * PRIVACY: All repository content is stored locally in IndexedDB.
 * NO code is ever uploaded to ORIZON servers.
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Sparkles, Settings, Shield, Zap, ArrowRight } from 'lucide-react';

// UI Components
import {
  Card, Button, EmptyState, Tabs, TabList, TabButton, TabPanels, TabPanel
} from '@/app/components/ui';

// Layout
import AppLayout from '@/app/components/layout/AppLayout';

// Shared Components
import Alert from '@/app/components/shared/Alert';
import ConfigSection from '@/app/components/config/ConfigSection';
import OutputSection from '@/app/components/output/OutputSection';

// Git-first Components
import { GitInputSection, PrivacyNotice, LocalCachePanel, CacheStatusBar, AIProviderStatus } from './components';
import ConfigPresets from './components/ConfigPresets';
import SmartConfigPanel from './components/SmartConfigPanel';
import OutputSettingsPanel from './components/OutputSettingsPanel';
import AnalysisPlanIndicator from './components/AnalysisPlanIndicator';
import AnalysisProgress from './components/AnalysisProgress';

// Hooks
import useAnalysis from '@/app/hooks/useAnalysis';
import useFileUpload from '@/app/hooks/useFileUpload';
import useRepositories from '@/app/hooks/useRepositories';
import useIndexedDB from '@/app/hooks/useIndexedDB';

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function AnalyzePageContent() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id || 'anonymous';
  const searchParams = useSearchParams();
  const router = useRouter();
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Tab state with URL persistence
  const validTabs = ['input', 'configure', 'results', 'cache'];
  const tabFromUrl = searchParams.get('tab');
  const initialTab = validTabs.includes(tabFromUrl) ? tabFromUrl : 'input';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Update URL when tab changes
  const handleTabChange = useCallback((newTab) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.replace(`/analyze?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // Git/Repository state from hooks
  const {
    isConnected,
    connection,
    repositories,
    selectedRepo,
    selectRepository,
    loading: reposLoading,
    error: reposError,
    branches,
    selectedBranch,
    changeBranch,
    fileTree,
    loadingFiles,
    selectedFiles,
    toggleFileSelection,
    selectAllCodeFiles,
    selectByPattern,
    clearSelection,
    fetchRepositories,
    getFilesForAnalysis,
    cachedRepos,
    privacyNotice
  } = useRepositories();

  // IndexedDB state for cache management
  const {
    storageStats,
    cachedRepos: indexedDBCachedRepos,
    clearCache,
    cleanupCache,
    formatStorageSize,
    isLoading: cacheLoading,
    cacheRepository,
    getCachedFilePaths,
    getCacheManifest,
    removeFromCache,
    refreshCache
  } = useIndexedDB(userId);

  // Cache panel state
  const [showCachePanel, setShowCachePanel] = useState(false);
  const [cacheManifest, setCacheManifest] = useState([]);
  const [cachedFilePaths, setCachedFilePaths] = useState([]);
  const [isSavingCache, setIsSavingCache] = useState(false);

  // Load cache manifest when panel opens
  useEffect(() => {
    if (showCachePanel) {
      loadCacheManifest();
    }
  }, [showCachePanel]);

  // Load cached file paths when repo changes
  useEffect(() => {
    if (selectedRepo) {
      loadCachedFilePaths();
    }
  }, [selectedRepo]);

  const loadCacheManifest = async () => {
    const manifest = await getCacheManifest();
    setCacheManifest(manifest);
  };

  const loadCachedFilePaths = async () => {
    if (selectedRepo) {
      const paths = await getCachedFilePaths(selectedRepo.owner, selectedRepo.name);
      setCachedFilePaths(paths);
    }
  };

  // Save selected files to cache
  const handleSaveToCache = async () => {
    if (!selectedRepo || selectedFiles.length === 0) return;

    try {
      setIsSavingCache(true);
      setSuccess('Fetching files for cache...');

      // Fetch file contents
      const files = await getFilesForAnalysis();

      if (files.length === 0) {
        setError('No files to cache');
        return;
      }

      // Save to IndexedDB
      await cacheRepository(selectedRepo, files, selectedBranch);

      setSuccess(`Cached ${files.length} files locally`);
      await loadCachedFilePaths();
      await loadCacheManifest();

      // Clear success after 3s
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to cache files: ' + err.message);
    } finally {
      setIsSavingCache(false);
    }
  };

  // Handle removing a repo from cache
  const handleRemoveFromCache = async (owner, name) => {
    await removeFromCache(owner, name);
    await loadCacheManifest();
    await loadCachedFilePaths();
  };

  // Handle clear all cache
  const handleClearAllCache = async () => {
    await clearCache();
    setCacheManifest([]);
    setCachedFilePaths([]);
  };

  // Calculate cache totals
  const cacheTotals = {
    repos: cacheManifest.length,
    files: cacheManifest.reduce((sum, r) => sum + (r.fileCount || 0), 0),
    size: cacheManifest.reduce((sum, r) => sum + (r.totalSize || 0), 0)
  };

  // Alternative input states
  const [codeInput, setCodeInput] = useState('');

  // Config states
  const [config, setConfig] = useState({
    userStories: true,
    testCases: true,
    acceptanceCriteria: true,
    edgeCases: false,
    securityTests: false,
    outputFormat: 'markdown',
    testFramework: 'generic',
    additionalContext: ''
  });
  const [activePreset, setActivePreset] = useState(null);
  const [smartConfig, setSmartConfig] = useState(null);
  const [outputSettings, setOutputSettings] = useState(null);

  // API states (loaded from Settings - single source of truth)
  const [provider, setProvider] = useState('claude');
  const [apiKey, setApiKey] = useState('');
  const [lmStudioUrl, setLmStudioUrl] = useState('http://localhost:1234');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [claudeModel, setClaudeModel] = useState('claude-sonnet-4-20250514');
  const [lmStudioModel, setLmStudioModel] = useState('');

  // Custom hooks for analysis and file upload
  const {
    loading: analysisLoading,
    error,
    success,
    results,
    tokenUsage,
    analyzeCodebase,
    analyzeFiles,
    clearResults,
    setError,
    setSuccess,
    progress: analysisProgress,
    analysisStartTime
  } = useAnalysis();

  const {
    uploadedFiles,
    setUploadedFiles,
    isDragging,
    setIsDragging,
    handleDrop,
    handleFileSelect,
    clearFiles
  } = useFileUpload(setError, setSuccess);

  const loading = analysisLoading || reposLoading || loadingFiles;

  // Calculate token estimate
  const getInputContent = useCallback(() => {
    // Git mode - selected files from repository
    if (selectedFiles.length > 0 && selectedRepo) {
      // This will be replaced with actual content when analyzing
      return `[${selectedFiles.length} files from ${selectedRepo.full_name}]`;
    }
    // Paste mode
    if (codeInput) return codeInput;
    // Upload mode
    if (uploadedFiles.length > 0) {
      return uploadedFiles.map(f => `=== FILE: ${f.name} ===\n${f.content}`).join('\n\n');
    }
    return '';
  }, [selectedFiles, selectedRepo, codeInput, uploadedFiles]);

  const estimatedTokens = Math.ceil(getInputContent().length / 4);
  const isTruncated = getInputContent().length > 100000;

  // Handle analysis - uses multi-pass for files (100% coverage)
  const handleAnalyze = async () => {
    const model = provider === 'lmstudio' ? lmStudioModel : claudeModel;

    // Git mode - use multi-pass analysis for 100% file coverage
    if (selectedFiles.length > 0 && selectedRepo) {
      setSuccess('Fetching selected files...');
      const files = await getFilesForAnalysis();
      if (files.length === 0) {
        setError('Failed to fetch file contents');
        return;
      }
      setSuccess('Starting multi-pass analysis...');

      // Use the new multi-pass endpoint for files
      await analyzeFiles(files, apiKey, config, model, provider, lmStudioUrl);
      return;
    }

    // Paste mode - use single-pass analysis
    if (codeInput.trim()) {
      await analyzeCodebase(codeInput, apiKey, config, model, provider, lmStudioUrl);
      return;
    }

    // Upload mode - use multi-pass if many files, otherwise single-pass
    if (uploadedFiles.length > 0) {
      const files = uploadedFiles.map(f => ({ path: f.name, content: f.content }));

      // Use multi-pass for uploaded files too (100% coverage)
      await analyzeFiles(files, apiKey, config, model, provider, lmStudioUrl);
      return;
    }

    setError('Please provide code to analyze');
  };

  // Clear all inputs
  const clearAll = () => {
    setCodeInput('');
    clearFiles();
    clearSelection();
    clearResults();
  };

  // Can analyze check
  const canAnalyze = (provider === 'lmstudio' || apiKey) &&
                     (codeInput.trim() || uploadedFiles.length > 0 || selectedFiles.length > 0);

  // Load user settings (single source of truth from Settings page)
  useEffect(() => {
    async function loadUserSettings() {
      if (status === 'loading' || !session || settingsLoaded) return;

      try {
        const response = await fetch('/api/user/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.claudeApiKey) {
            setApiKey(data.claudeApiKey);
            setHasApiKey(true);
          }
          if (data.lmStudioUrl) setLmStudioUrl(data.lmStudioUrl);
          if (data.aiProvider) setProvider(data.aiProvider);
          if (data.claudeModel) setClaudeModel(data.claudeModel);
          if (data.lmStudioModel) setLmStudioModel(data.lmStudioModel);
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    }

    loadUserSettings();
  }, [session, status, settingsLoaded]);

  // Handle "Run Again" from history page
  useEffect(() => {
    const isRunAgain = searchParams.get('runAgain') === 'true';
    if (!isRunAgain) return;

    const runAgainDataStr = sessionStorage.getItem('runAgainData');
    if (!runAgainDataStr) return;

    try {
      const runAgainData = JSON.parse(runAgainDataStr);

      // Apply saved config
      if (runAgainData.config) {
        setConfig(prev => ({ ...prev, ...runAgainData.config }));
      }

      // Apply provider/model if different from saved settings
      if (runAgainData.provider) {
        setProvider(runAgainData.provider);
      }
      if (runAgainData.model) {
        if (runAgainData.provider === 'lmstudio') {
          setLmStudioModel(runAgainData.model);
        } else {
          setClaudeModel(runAgainData.model);
        }
      }

      // Show success message about config applied
      setSuccess('Configuration from previous analysis loaded. Select input and click Analyze.');

      // Clear sessionStorage and URL param
      sessionStorage.removeItem('runAgainData');
      router.replace('/analyze?tab=input', { scroll: false });

      // Clear success after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error loading run again data:', error);
    }
  }, [searchParams]);

  return (
    <AppLayout>
      <div className="w-full">
        <main className="p-4 md:p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-2xl font-bold text-white font-primary">
                  Code Analysis
                </h1>
                <p className="text-sm text-text-secondary-dark mt-1">
                  Analyze code from GitHub repositories, paste, or upload files
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10
                              border border-primary/20 rounded-full text-xs text-primary">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Local Storage Only</span>
                </div>
                {!isConnected && (
                  <a
                    href="/settings?tab=integrations"
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10
                             rounded-lg text-sm text-white hover:bg-white/10 transition-all"
                  >
                    <Settings className="w-4 h-4" />
                    Connect GitHub
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          {/* Main Tabs */}
          <Tabs value={activeTab} onChange={handleTabChange} className="mb-6">
            <TabList>
              <TabButton value="input">Input</TabButton>
              <TabButton value="configure">Configure</TabButton>
              <TabButton value="results">Results</TabButton>
              <TabButton value="cache">Local Cache</TabButton>
            </TabList>

            <TabPanels className="mt-6">
              {/* Input Tab - Git-First */}
              <TabPanel value="input">
                <GitInputSection
                  isConnected={isConnected}
                  repositories={repositories}
                  selectedRepo={selectedRepo}
                  onSelectRepo={selectRepository}
                  onRefreshRepos={fetchRepositories}
                  reposLoading={reposLoading}
                  reposError={reposError}
                  branches={branches}
                  selectedBranch={selectedBranch}
                  onChangeBranch={changeBranch}
                  fileTree={fileTree}
                  selectedFiles={selectedFiles}
                  onToggleFile={toggleFileSelection}
                  onSelectAllCodeFiles={selectAllCodeFiles}
                  onSelectByPattern={selectByPattern}
                  onClearSelection={clearSelection}
                  filesLoading={loadingFiles}
                  cachedRepos={cachedRepos}
                  codeInput={codeInput}
                  onCodeInputChange={setCodeInput}
                  uploadedFiles={uploadedFiles}
                  onFileUpload={handleFileSelect}
                  onClearUploadedFiles={clearFiles}
                  onDrop={handleDrop}
                  estimatedTokens={estimatedTokens}
                  isTruncated={isTruncated}
                  // Cache props
                  onSaveToCache={handleSaveToCache}
                  isSavingCache={isSavingCache}
                  cachedFiles={cachedFilePaths}
                />

                {/* Analysis Plan Indicator - Shows when files are selected */}
                {selectedFiles.length > 0 && !analysisLoading && (
                  <div className="mt-6">
                    <AnalysisPlanIndicator
                      selectedFilePaths={selectedFiles}
                      config={config}
                    />
                  </div>
                )}

                {/* Analysis Progress - Shows during analysis */}
                {analysisLoading && analysisProgress && (
                  <div className="mt-6">
                    <AnalysisProgress
                      progress={analysisProgress}
                      startTime={analysisStartTime}
                      error={error}
                    />
                  </div>
                )}
              </TabPanel>

              {/* Configure Tab */}
              <TabPanel value="configure">
                {/* AI Provider Status - Editable on this page */}
                <AIProviderStatus
                  provider={provider}
                  hasApiKey={hasApiKey}
                  apiKey={apiKey}
                  lmStudioUrl={lmStudioUrl}
                  claudeModel={claudeModel}
                  lmStudioModel={lmStudioModel}
                  isLoading={!settingsLoaded}
                  onProviderChange={setProvider}
                  onModelChange={setClaudeModel}
                  onLmStudioUrlChange={setLmStudioUrl}
                  onLmStudioModelChange={setLmStudioModel}
                />

                {/* Smart Configuration Panel - File Classification & Goal-based Config */}
                <div className="mt-6">
                  <SmartConfigPanel
                    selectedFiles={selectedFiles}
                    config={config}
                    setConfig={setConfig}
                    onSmartConfigChange={setSmartConfig}
                  />
                </div>

                {/* Output Settings Panel - Format, Framework, Context */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-white mb-4">Output Settings</h3>
                  <OutputSettingsPanel
                    selectedFiles={selectedFiles}
                    config={config}
                    setConfig={setConfig}
                    onOutputSettingsChange={setOutputSettings}
                  />
                </div>
              </TabPanel>

              {/* Results Tab */}
              <TabPanel value="results">
                {results ? (
                  <OutputSection results={results} />
                ) : (
                  <EmptyState
                    icon={<Sparkles className="w-12 h-12" />}
                    title="No results yet"
                    description="Select files from a repository or paste code, then click 'Analyze Code' to generate QA artifacts"
                  />
                )}
              </TabPanel>

              {/* Privacy Tab - Now shows Local Cache Panel */}
              <TabPanel value="cache">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Local Cache Panel */}
                  <LocalCachePanel
                    cacheManifest={cacheManifest}
                    storageStats={storageStats}
                    onRemoveRepo={handleRemoveFromCache}
                    onClearAll={handleClearAllCache}
                    formatStorageSize={formatStorageSize}
                    isLoading={cacheLoading}
                    onRefresh={async () => {
                      await refreshCache();
                      await loadCacheManifest();
                    }}
                  />

                  {/* Privacy Notice */}
                  <div>
                    <PrivacyNotice
                      storageStats={storageStats}
                      onClearCache={handleClearAllCache}
                      onCleanupOldData={cleanupCache}
                      formatStorageSize={formatStorageSize}
                      isLoading={cacheLoading}
                      compact={false}
                    />
                  </div>
                </div>
              </TabPanel>
            </TabPanels>
          </Tabs>

          {/* Action Buttons - Context-aware based on active tab */}
          <div className="flex gap-4 mb-6">
            {activeTab === 'input' && (
              <>
                {/* Quick Analyze - uses default settings */}
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={!canAnalyze || loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Quick Analyze</span>
                    </>
                  )}
                </Button>

                {/* Next: Configure - main action to proceed */}
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => handleTabChange('configure')}
                  disabled={!(codeInput.trim() || uploadedFiles.length > 0 || selectedFiles.length > 0)}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Next: Configure</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            )}

            {activeTab === 'configure' && (
              <>
                {/* Back to Input */}
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => handleTabChange('input')}
                  disabled={loading}
                >
                  Back to Input
                </Button>

                {/* Analyze Code - main action */}
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={!canAnalyze || loading}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analyze Code</span>
                    </>
                  )}
                </Button>
              </>
            )}

            {activeTab === 'results' && (
              <>
                {/* New Analysis */}
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={clearAll}
                  disabled={loading}
                >
                  New Analysis
                </Button>

                {/* Re-analyze with different settings */}
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => handleTabChange('configure')}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Adjust & Re-analyze</span>
                </Button>
              </>
            )}

            {activeTab === 'cache' && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleTabChange('input')}
                className="flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Start Analysis</span>
              </Button>
            )}
          </div>

          {/* Token Usage Display */}
          {tokenUsage && (
            <Card className="p-4 bg-surface-dark/50">
              <div className="flex items-center justify-center gap-6 text-sm font-secondary">
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary-dark">Input:</span>
                  <span className="text-primary font-semibold">
                    {(tokenUsage.input || tokenUsage.input_tokens)?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary-dark">Output:</span>
                  <span className="text-accent font-semibold">
                    {(tokenUsage.output || tokenUsage.output_tokens)?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center mt-8 text-xs text-text-secondary-dark font-secondary flex items-center justify-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Your code stays local • Built with Claude AI</span>
          </div>
        </main>

        {/* Cache Status Bar - Always visible at bottom */}
        <div className="sticky bottom-0 z-40">
          <CacheStatusBar
            totalRepos={cacheTotals.repos}
            totalFiles={cacheTotals.files}
            totalSize={cacheTotals.size}
            formatStorageSize={formatStorageSize}
            onViewCache={() => {
              // Switch to Local Cache tab
              handleTabChange('cache');
            }}
            onClearAll={handleClearAllCache}
            isLoading={cacheLoading}
          />
        </div>
      </div>
    </AppLayout>
  );
}

// Loading fallback for Suspense
function AnalyzePageLoading() {
  return (
    <AppLayout>
      <div className="w-full">
        <main className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    </AppLayout>
  );
}

// Default export wraps the content component with Suspense for useSearchParams
export default function AnalyzePage() {
  return (
    <Suspense fallback={<AnalyzePageLoading />}>
      <AnalyzePageContent />
    </Suspense>
  );
}
