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
import { Loader2, Sparkles, Settings, Shield, Zap, ArrowRight, ChevronDown, ChevronUp, Check } from 'lucide-react';

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
import AnalysisDashboard from './components/AnalysisDashboard';
import AnalysisPreview from './components/AnalysisPreview';
import RepoAnalysisSummary from './components/RepoAnalysisSummary';
import GoalSelector from './components/GoalSelector';

// Hooks
import useAnalysis from '@/app/hooks/useAnalysis';
import useAnalysisStream, { AnalysisStatus } from '@/app/hooks/useAnalysisStream';
import { applyGoalConfig, getGoalFiles } from '@/lib/analysisGoals';
import useFileUpload from '@/app/hooks/useFileUpload';
import useRepositories from '@/app/hooks/useRepositories';
import useIndexedDB from '@/app/hooks/useIndexedDB';
import useAnalyzePersistence, { createAnalyzeSnapshot } from '@/app/hooks/useAnalyzePersistence';

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function AnalyzePageContent() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id || 'anonymous';
  const searchParams = useSearchParams();
  const router = useRouter();
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Persistence hook for state recovery
  const {
    isLoaded: persistenceLoaded,
    initialState: persistedState,
    saveState: persistState,
    clearState: clearPersistedState,
    markRestored,
    hasRestored,
    saveError: persistenceError,
    loadError: persistenceLoadError,
    dismissErrors: dismissPersistenceErrors
  } = useAnalyzePersistence();

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
    batchToggleFiles,
    selectAllCodeFiles,
    selectByPattern,
    clearSelection,
    fetchRepositories,
    getFilesForAnalysis,
    cachedRepos,
    privacyNotice,
    repoAnalysis,
    analysisLoading: repoAnalysisLoading
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
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Per-card file selection (expert mode)
  const [cardFiles, setCardFiles] = useState({
    userStories: [],
    testCases: [],
    acceptanceCriteria: [],
    useSharedFiles: true // When true, all cards use selectedFiles
  });

  // Update cardFiles when selectedFiles changes (if useSharedFiles is true)
  useEffect(() => {
    if (cardFiles.useSharedFiles) {
      setCardFiles(prev => ({
        ...prev,
        userStories: selectedFiles,
        testCases: selectedFiles,
        acceptanceCriteria: selectedFiles
      }));
    }
  }, [selectedFiles, cardFiles.useSharedFiles]);

  // Handler for per-card file changes
  const handleCardFilesChange = useCallback((card, files) => {
    setCardFiles(prev => ({
      ...prev,
      [card]: files,
      useSharedFiles: false // Disable shared mode when manually selecting
    }));
  }, []);

  // Toggle between shared and per-card file selection
  const toggleSharedFiles = useCallback((useShared) => {
    if (useShared) {
      setCardFiles({
        userStories: selectedFiles,
        testCases: selectedFiles,
        acceptanceCriteria: selectedFiles,
        useSharedFiles: true
      });
    } else {
      setCardFiles(prev => ({
        ...prev,
        useSharedFiles: false
      }));
    }
  }, [selectedFiles]);

  // Auto-suggest test framework when repo analysis detects one
  useEffect(() => {
    if (repoAnalysis?.testFramework?.id && config.testFramework === 'generic') {
      setConfig(prev => ({
        ...prev,
        testFramework: repoAnalysis.testFramework.id
      }));
    }
  }, [repoAnalysis]);

  // Handle goal selection - auto-configure files and settings
  const handleSelectGoal = useCallback((goal) => {
    setSelectedGoal(goal);

    if (goal.id === 'custom') {
      // Custom goal - don't change anything, user will select manually
      return;
    }

    // Get files for this goal from repo analysis
    const goalFiles = getGoalFiles(goal, repoAnalysis);
    if (goalFiles.length > 0) {
      // Clear existing selection and add goal files
      clearSelection();
      batchToggleFiles(goalFiles, 'add');
    }

    // Apply goal config settings
    if (goal.config) {
      setConfig(prev => applyGoalConfig(goal, prev));
    }
  }, [repoAnalysis, clearSelection, batchToggleFiles]);

  // Reset goal when repo changes
  useEffect(() => {
    setSelectedGoal(null);
  }, [selectedRepo]);

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

  // Streaming analysis hook for real-time visibility
  const {
    status: streamStatus,
    isAnalyzing: streamIsAnalyzing,
    isComplete: streamIsComplete,
    plan: streamPlan,
    progress: streamProgress,
    chunks: streamChunks,
    currentActivity: streamCurrentActivity,
    tokenUsage: streamTokenUsage,
    actualCost: streamActualCost,
    results: streamResults,
    error: streamError,
    timing: streamTiming,
    elapsedFormatted: streamElapsedFormatted,
    dataFlow: streamDataFlow,
    startAnalysis: startStreamAnalysis,
    cancelAnalysis: cancelStreamAnalysis,
    reset: resetStream
  } = useAnalysisStream();

  const {
    uploadedFiles,
    setUploadedFiles,
    isDragging,
    setIsDragging,
    handleDrop,
    handleFileSelect,
    clearFiles
  } = useFileUpload(setError, setSuccess);

  const loading = analysisLoading || streamIsAnalyzing || reposLoading || loadingFiles;

  // Restore state from persistence when loaded (ONLY ONCE)
  useEffect(() => {
    // Only restore once
    if (!persistenceLoaded || !persistedState || hasRestored()) return;

    // Mark as restored FIRST to prevent re-entry
    markRestored();

    // Restore config
    if (persistedState.config) {
      setConfig(prev => ({ ...prev, ...persistedState.config }));
    }

    // Restore cardFiles
    if (persistedState.cardFiles) {
      setCardFiles(persistedState.cardFiles);
    }

    // Restore code input
    if (persistedState.codeInput) {
      setCodeInput(persistedState.codeInput);
    }

    // Restore active tab (if not overridden by URL)
    if (persistedState.activeTab && !searchParams.get('tab')) {
      setActiveTab(persistedState.activeTab);
    }

    // Note: Repository and file selection are handled by useRepositories hook
    // which has its own persistence via IndexedDB

    // Show success message
    if (persistedState.selectedFiles?.length > 0 || persistedState.codeInput) {
      setSuccess('Your previous session was restored.');
      setTimeout(() => setSuccess(''), 3000);
    }
  }, [persistenceLoaded, persistedState, hasRestored, markRestored]);

  // Save state to persistence when key values change
  useEffect(() => {
    if (!persistenceLoaded) return;

    // Don't save until initial restore is complete
    if (!hasRestored()) return;

    // Don't save during analysis
    if (streamIsAnalyzing) return;

    const snapshot = createAnalyzeSnapshot({
      selectedRepo,
      selectedBranch,
      selectedFiles,
      config,
      cardFiles,
      activeTab,
      codeInput,
      uploadedFiles
    });

    persistState(snapshot);
  }, [
    persistenceLoaded,
    hasRestored,
    selectedRepo,
    selectedBranch,
    selectedFiles,
    config,
    cardFiles,
    activeTab,
    codeInput,
    uploadedFiles,
    streamIsAnalyzing,
    persistState
  ]);

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

  // Handle analysis - uses streaming SSE for real-time visibility
  const handleAnalyze = async () => {
    const model = provider === 'lmstudio' ? lmStudioModel : claudeModel;

    // Build stream config with per-card file info if applicable
    const buildStreamConfig = () => {
      const streamConfig = { ...config, model };

      // Include per-card file selections if not using shared mode
      if (!cardFiles.useSharedFiles) {
        streamConfig.perCardFiles = {
          userStories: cardFiles.userStories,
          testCases: cardFiles.testCases,
          acceptanceCriteria: cardFiles.acceptanceCriteria
        };
      }

      return streamConfig;
    };

    // Git mode - use streaming analysis for real-time visibility
    if (selectedFiles.length > 0 && selectedRepo) {
      setSuccess('Fetching selected files...');
      const files = await getFilesForAnalysis();
      if (files.length === 0) {
        setError('Failed to fetch file contents');
        return;
      }
      setSuccess(''); // Clear success message before starting stream

      // Use streaming SSE endpoint for real-time visibility
      const streamConfig = buildStreamConfig();
      await startStreamAnalysis(files, streamConfig, apiKey, provider, lmStudioUrl);
      return;
    }

    // Paste mode - use single-pass analysis (no streaming needed)
    if (codeInput.trim()) {
      await analyzeCodebase(codeInput, apiKey, config, model, provider, lmStudioUrl);
      return;
    }

    // Upload mode - use streaming for files
    if (uploadedFiles.length > 0) {
      const files = uploadedFiles.map(f => ({ path: f.name, content: f.content }));

      // Use streaming for uploaded files too
      const streamConfig = buildStreamConfig();
      await startStreamAnalysis(files, streamConfig, apiKey, provider, lmStudioUrl);
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
    resetStream(); // Reset streaming state
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
      <div className="min-h-screen bg-bg-dark">
        {/* Sticky Header */}
        <div className="border-b border-white/10 bg-surface-dark/50 backdrop-blur-sm">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-cyan-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Code Analysis</h1>
                  <p className="text-sm text-text-secondary-dark">
                    Analyze code from GitHub repositories, paste, or upload files
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10
                              border border-primary/20 rounded-full text-xs text-primary">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Local Storage Only</span>
                </div>
                {!isConnected && (
                  <a
                    href="/settings?tab=github"
                    className="flex items-center gap-2 px-4 py-2 bg-surface-dark border border-white/10
                             rounded-lg text-sm text-white hover:bg-white/10 transition-all"
                  >
                    <Settings className="w-4 h-4" />
                    Connect GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-6 py-8">
          {/* Alerts */}
          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}
          {persistenceError && (
            <Alert
              type="warning"
              message={persistenceError}
              onDismiss={dismissPersistenceErrors}
            />
          )}
          {persistenceLoadError && (
            <Alert
              type="warning"
              message={persistenceLoadError}
              onDismiss={dismissPersistenceErrors}
            />
          )}

          {/* Real-time Analysis Dashboard - ALWAYS visible during analysis (outside tabs) */}
          {(streamIsAnalyzing || streamIsComplete || streamStatus === AnalysisStatus.ERROR) && (
            <div className="mb-6">
              <AnalysisDashboard
                status={streamStatus}
                plan={streamPlan}
                progress={streamProgress}
                chunks={streamChunks}
                currentActivity={streamCurrentActivity}
                tokenUsage={streamTokenUsage}
                actualCost={streamActualCost}
                timing={streamTiming}
                elapsedFormatted={streamElapsedFormatted}
                dataFlow={streamDataFlow}
                error={streamError}
                onCancel={cancelStreamAnalysis}
              />
            </div>
          )}

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
                  onBatchToggleFiles={batchToggleFiles}
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
                  // Compact mode when goal is selected
                  compactMode={selectedGoal && selectedGoal.id !== 'custom'}
                  selectedGoal={selectedGoal}
                />

                {/* Goal Selector - Shows after repo analysis is complete */}
                {selectedRepo && repoAnalysis && !repoAnalysisLoading && (
                  <div className="mt-6">
                    <GoalSelector
                      repoAnalysis={repoAnalysis}
                      selectedGoal={selectedGoal}
                      onSelectGoal={handleSelectGoal}
                    />
                  </div>
                )}

                {/* Loading state for repo analysis */}
                {selectedRepo && repoAnalysisLoading && (
                  <div className="mt-6 bg-surface-dark border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-text-secondary-dark">Analyzing repository...</span>
                    </div>
                  </div>
                )}

                {/* Analysis Plan Indicator - Shows when files are selected (before analysis) */}
                {selectedFiles.length > 0 && !streamIsAnalyzing && streamStatus === AnalysisStatus.IDLE && (
                  <div className="mt-6">
                    <AnalysisPlanIndicator
                      selectedFilePaths={selectedFiles}
                      config={config}
                    />
                  </div>
                )}

                {/* Fallback: Old progress for single-pass analysis (paste mode) */}
                {analysisLoading && analysisProgress && !streamIsAnalyzing && (
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
                {/* Goal Summary - Show when a goal is selected */}
                {selectedGoal && selectedGoal.id !== 'custom' && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Check className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">
                            {selectedGoal.name}
                          </h3>
                          <p className="text-xs text-text-secondary-dark mt-0.5">
                            {selectedGoal.description} • {selectedFiles.length} files selected
                          </p>
                          {selectedGoal.executable && (
                            <p className="text-xs text-green-400 mt-1">
                              Tests will be executable
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleTabChange('input')}
                        className="text-xs text-primary hover:underline"
                      >
                        Change goal
                      </button>
                    </div>
                  </div>
                )}

                {/* AI Provider Status - Always visible */}
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

                {/* Analysis Preview - Always show when files selected */}
                {selectedFiles.length > 0 && (
                  <div className="mt-6">
                    <AnalysisPreview
                      selectedFiles={selectedFiles}
                      config={config}
                    />
                  </div>
                )}

                {/* Advanced Options Toggle - Only show when goal selected */}
                {selectedGoal && selectedGoal.id !== 'custom' ? (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      className="flex items-center gap-2 text-sm text-text-secondary-dark hover:text-white transition-colors"
                    >
                      {showAdvancedOptions ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      <span>Advanced Options</span>
                    </button>

                    {showAdvancedOptions && (
                      <div className="mt-4 space-y-6">
                        {/* Smart Configuration Panel */}
                        <SmartConfigPanel
                          selectedFiles={selectedFiles}
                          config={config}
                          setConfig={setConfig}
                          onSmartConfigChange={setSmartConfig}
                          fileTree={fileTree}
                          cardFiles={cardFiles}
                          onCardFilesChange={handleCardFilesChange}
                          onToggleSharedFiles={toggleSharedFiles}
                        />

                        {/* Output Settings Panel */}
                        <div>
                          <h3 className="text-lg font-medium text-white mb-4">Output Settings</h3>
                          <OutputSettingsPanel
                            selectedFiles={selectedFiles}
                            config={config}
                            setConfig={setConfig}
                            onOutputSettingsChange={setOutputSettings}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Show all options when no goal or custom goal */
                  <>
                    {/* Smart Configuration Panel */}
                    <div className="mt-6">
                      <SmartConfigPanel
                        selectedFiles={selectedFiles}
                        config={config}
                        setConfig={setConfig}
                        onSmartConfigChange={setSmartConfig}
                        fileTree={fileTree}
                        cardFiles={cardFiles}
                        onCardFilesChange={handleCardFilesChange}
                        onToggleSharedFiles={toggleSharedFiles}
                      />
                    </div>

                    {/* Output Settings Panel */}
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-white mb-4">Output Settings</h3>
                      <OutputSettingsPanel
                        selectedFiles={selectedFiles}
                        config={config}
                        setConfig={setConfig}
                        onOutputSettingsChange={setOutputSettings}
                      />
                    </div>
                  </>
                )}
              </TabPanel>

              {/* Results Tab */}
              <TabPanel value="results">
                {/* Show streaming results if available, otherwise legacy results */}
                {streamResults ? (
                  <OutputSection results={streamResults} />
                ) : results ? (
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

          {/* Token Usage Display - Shows streaming or legacy token usage */}
          {(streamTokenUsage?.input || tokenUsage) && (
            <Card className="p-4 bg-surface-dark/50">
              <div className="flex items-center justify-center gap-6 text-sm font-secondary">
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary-dark">Input:</span>
                  <span className="text-primary font-semibold">
                    {(streamTokenUsage?.input || tokenUsage?.input || tokenUsage?.input_tokens || 0).toLocaleString()}
                  </span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary-dark">Output:</span>
                  <span className="text-accent font-semibold">
                    {(streamTokenUsage?.output || tokenUsage?.output || tokenUsage?.output_tokens || 0).toLocaleString()}
                  </span>
                </div>
                {streamActualCost && streamActualCost !== '$0.0000' && (
                  <>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-2">
                      <span className="text-text-secondary-dark">Cost:</span>
                      <span className="text-green-400 font-semibold">{streamActualCost}</span>
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center mt-8 text-xs text-text-secondary-dark font-secondary flex items-center justify-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Your code stays local • Built with Claude AI</span>
          </div>
        </div>

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
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-text-secondary-dark">Loading analysis...</p>
        </div>
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
