'use client';

/**
 * Analyze V2 Page - Chat-Based Code Analysis
 *
 * A redesigned analysis interface with:
 * - Split view: Source selection (left) + AI Chat (right)
 * - Conversational flow for configuration
 * - Real-time streaming with Simple/Detailed views
 * - Step-by-step guidance
 *
 * This exists alongside the original /analyze page for comparison.
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Loader2, Sparkles, Shield, Settings, ArrowLeft, Beaker
} from 'lucide-react';

// Layout
import AppLayout from '@/app/components/layout/AppLayout';

// V2 Components
import SourcePanel from './components/SourcePanel';
import AIChatPanel from './components/AIChatPanel';

// Hooks (reuse from original)
import useAnalysisStream, { AnalysisStatus } from '@/app/hooks/useAnalysisStream';
import useFileUpload from '@/app/hooks/useFileUpload';
import useRepositories from '@/app/hooks/useRepositories';
import useIndexedDB from '@/app/hooks/useIndexedDB';

function AnalyzeV2Content() {
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id || 'anonymous';
  const router = useRouter();
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Repository state
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
    clearSelection,
    fetchRepositories,
    getFilesForAnalysis
  } = useRepositories();

  // IndexedDB for cache info
  const {
    getCachedFilePaths
  } = useIndexedDB(userId);

  const [cachedFilePaths, setCachedFilePaths] = useState([]);

  // Load cached file paths when repo changes
  useEffect(() => {
    async function loadCached() {
      if (selectedRepo) {
        const paths = await getCachedFilePaths(selectedRepo.owner, selectedRepo.name);
        setCachedFilePaths(paths);
      } else {
        setCachedFilePaths([]);
      }
    }
    loadCached();
  }, [selectedRepo, getCachedFilePaths]);

  // Alternative input states
  const [codeInput, setCodeInput] = useState('');

  // File upload hook
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const {
    uploadedFiles,
    setUploadedFiles,
    handleFileSelect,
    clearFiles
  } = useFileUpload(setUploadError, setUploadSuccess);

  // Config state
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

  // AI Provider state (loaded from settings)
  const [provider, setProvider] = useState('claude');
  const [apiKey, setApiKey] = useState('');
  const [lmStudioUrl, setLmStudioUrl] = useState('http://localhost:1234');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [claudeModel, setClaudeModel] = useState('claude-sonnet-4-20250514');
  const [lmStudioModel, setLmStudioModel] = useState('');

  // Streaming analysis hook
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
    elapsedFormatted: streamElapsedFormatted,
    dataFlow: streamDataFlow,
    startAnalysis: startStreamAnalysis,
    cancelAnalysis: cancelStreamAnalysis,
    reset: resetStream
  } = useAnalysisStream();

  // Load user settings on mount
  useEffect(() => {
    async function loadUserSettings() {
      if (sessionStatus === 'loading' || !session || settingsLoaded) return;

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
  }, [session, sessionStatus, settingsLoaded]);

  // Fetch repos when connected
  useEffect(() => {
    if (isConnected && repositories.length === 0) {
      fetchRepositories();
    }
  }, [isConnected, repositories.length, fetchRepositories]);

  // Calculate token estimate
  const estimatedTokens = useCallback(() => {
    if (selectedFiles.length > 0) {
      // Rough estimate: 15K tokens per 50 files
      return Math.ceil(selectedFiles.length * 300);
    }
    if (codeInput) {
      return Math.ceil(codeInput.length / 4);
    }
    if (uploadedFiles.length > 0) {
      const totalChars = uploadedFiles.reduce((sum, f) => sum + (f.content?.length || 0), 0);
      return Math.ceil(totalChars / 4);
    }
    return 0;
  }, [selectedFiles, codeInput, uploadedFiles]);

  // Can analyze check
  const canAnalyze = (provider === 'lmstudio' || apiKey) &&
    (codeInput.trim() || uploadedFiles.length > 0 || selectedFiles.length > 0);

  // Handle analysis
  const handleAnalyze = async () => {
    const model = provider === 'lmstudio' ? lmStudioModel : claudeModel;
    const streamConfig = { ...config, model };

    // Git mode
    if (selectedFiles.length > 0 && selectedRepo) {
      const files = await getFilesForAnalysis();
      if (files.length === 0) {
        return;
      }
      await startStreamAnalysis(files, streamConfig, apiKey, provider, lmStudioUrl);
      return;
    }

    // Paste mode
    if (codeInput.trim()) {
      const files = [{ path: 'pasted-code.js', content: codeInput }];
      await startStreamAnalysis(files, streamConfig, apiKey, provider, lmStudioUrl);
      return;
    }

    // Upload mode
    if (uploadedFiles.length > 0) {
      const files = uploadedFiles.map(f => ({ path: f.name, content: f.content }));
      await startStreamAnalysis(files, streamConfig, apiKey, provider, lmStudioUrl);
    }
  };

  // Handle reset
  const handleReset = () => {
    resetStream();
  };

  return (
    <AppLayout>
      <div className="h-screen flex flex-col bg-bg-dark overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-white/10 bg-surface-dark/80 backdrop-blur-xl">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Back to V1 */}
                <a
                  href="/analyze"
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  title="Back to original Analyze page"
                >
                  <ArrowLeft className="w-4 h-4 text-text-secondary-dark" />
                </a>

                <div className="w-9 h-9 bg-gradient-to-br from-primary to-cyan-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold text-white">Code Analysis</h1>
                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-medium rounded">
                      V2 Beta
                    </span>
                  </div>
                  <p className="text-[10px] text-text-secondary-dark">
                    AI-powered QA generation with chat interface
                  </p>
                </div>

                {/* Step Progress */}
                <div className="flex items-center gap-2 ml-6 pl-6 border-l border-white/10">
                  <StepIndicator
                    num={1}
                    label="Select"
                    active={streamStatus === AnalysisStatus.IDLE && !selectedFiles.length}
                    complete={selectedFiles.length > 0 || codeInput || uploadedFiles.length > 0}
                  />
                  <ChevronIcon />
                  <StepIndicator
                    num={2}
                    label="Configure"
                    active={selectedFiles.length > 0 && streamStatus === AnalysisStatus.IDLE}
                    complete={streamIsAnalyzing || streamIsComplete}
                  />
                  <ChevronIcon />
                  <StepIndicator
                    num={3}
                    label="Generate"
                    active={streamIsAnalyzing}
                    complete={streamIsComplete}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded">
                  <Shield className="w-3 h-3 text-green-400" />
                  <span className="text-[10px] text-green-400">Local</span>
                </div>
                <a
                  href="/settings"
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4 text-text-secondary-dark" />
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Main Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Source Selection */}
          <div className="w-1/2 overflow-hidden">
            <SourcePanel
              isConnected={isConnected}
              repositories={repositories}
              selectedRepo={selectedRepo}
              onSelectRepo={selectRepository}
              reposLoading={reposLoading}
              branches={branches}
              selectedBranch={selectedBranch}
              onChangeBranch={changeBranch}
              fileTree={fileTree}
              selectedFiles={selectedFiles}
              onToggleFile={toggleFileSelection}
              onBatchToggleFiles={batchToggleFiles}
              onSelectAllCodeFiles={selectAllCodeFiles}
              onClearSelection={clearSelection}
              filesLoading={loadingFiles}
              cachedFilePaths={cachedFilePaths}
              codeInput={codeInput}
              onCodeInputChange={setCodeInput}
              uploadedFiles={uploadedFiles}
              onFileUpload={handleFileSelect}
              onClearUploadedFiles={clearFiles}
              estimatedTokens={estimatedTokens()}
            />
          </div>

          {/* Right: AI Chat */}
          <div className="w-1/2 overflow-hidden">
            <AIChatPanel
              selectedRepo={selectedRepo}
              selectedFiles={selectedFiles}
              codeInput={codeInput}
              uploadedFiles={uploadedFiles}
              status={streamStatus}
              isAnalyzing={streamIsAnalyzing}
              isComplete={streamIsComplete}
              plan={streamPlan}
              progress={streamProgress}
              chunks={streamChunks}
              currentActivity={streamCurrentActivity}
              tokenUsage={streamTokenUsage}
              actualCost={streamActualCost}
              results={streamResults}
              error={streamError}
              elapsedFormatted={streamElapsedFormatted}
              dataFlow={streamDataFlow}
              config={config}
              setConfig={setConfig}
              onAnalyze={handleAnalyze}
              onCancel={cancelStreamAnalysis}
              onReset={handleReset}
              canAnalyze={canAnalyze}
              provider={provider}
              claudeModel={claudeModel}
              hasApiKey={hasApiKey}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

/**
 * Step Indicator Component
 */
function StepIndicator({ num, label, active, complete }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
          ${complete
            ? 'bg-green-500 text-white'
            : active
              ? 'bg-gradient-to-br from-primary to-cyan-500 text-white'
              : 'bg-white/10 text-text-secondary-dark'}`}
      >
        {num}
      </div>
      <span className={`text-xs ${active || complete ? 'text-white' : 'text-text-secondary-dark'}`}>
        {label}
      </span>
    </div>
  );
}

/**
 * Chevron Icon
 */
function ChevronIcon() {
  return (
    <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

/**
 * Loading Fallback
 */
function AnalyzeV2Loading() {
  return (
    <AppLayout>
      <div className="h-screen bg-bg-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-text-secondary-dark">Loading V2 analysis...</p>
        </div>
      </div>
    </AppLayout>
  );
}

/**
 * Main Export with Suspense
 */
export default function AnalyzeV2Page() {
  return (
    <Suspense fallback={<AnalyzeV2Loading />}>
      <AnalyzeV2Content />
    </Suspense>
  );
}
