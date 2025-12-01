'use client';

/**
 * Dashboard Page (Main App) - REDESIGNED
 *
 * The main ORIZON application - requires authentication.
 * Enhanced with history sidebar, stats, and improved UX.
 *
 * Features:
 * - Recent analyses sidebar with quick access
 * - Tabbed workflow for better organization
 * - Usage statistics display
 * - Code input (paste, GitHub, file upload)
 * - Analysis configuration
 * - QA artifact generation
 * - Results display with export options
 */

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSession, signOut } from 'next-auth/react';
import {
  Loader2, Sparkles, LogOut, User, Settings,
  History, Zap, Activity, Clock, ChevronRight,
  X, Menu
} from 'lucide-react';

// UI Components
import {
  Card, CardHeader, CardTitle, CardContent, CardDescription,
  Button, Tag, EmptyState, Logo, Avatar, Tabs, TabList, TabButton, TabPanels, TabPanel
} from '@/app/components/ui';

// Existing Components
import Alert from '@/app/components/shared/Alert';
import InputSection from '@/app/components/input/InputSection';
import ConfigSection from '@/app/components/config/ConfigSection';
import OutputSection from '@/app/components/output/OutputSection';

// Disable SSR for ApiKeyInput to prevent hydration mismatch
const ApiKeyInput = dynamic(() => import('@/app/components/config/ApiKeyInput'), { ssr: false });

// Hooks
import useAnalysis from '@/app/hooks/useAnalysis';
import useFileUpload from '@/app/hooks/useFileUpload';
import useGitHubFetch from '@/app/hooks/useGitHubFetch';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [analysisStats, setAnalysisStats] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Input states
  const [inputTab, setInputTab] = useState('paste');
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

  // API states
  const [provider, setProvider] = useState('claude');
  const [apiKey, setApiKey] = useState('');
  const [lmStudioUrl, setLmStudioUrl] = useState('http://192.168.2.101:1234');
  const [selectedModel, setSelectedModel] = useState('');
  const model = 'claude-sonnet-4-20250514';

  // Custom hooks
  const {
    loading: analysisLoading,
    error,
    success,
    results,
    tokenUsage,
    analyzeCodebase,
    clearResults,
    setError,
    setSuccess
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

  const {
    githubUrl,
    setGithubUrl,
    githubBranch,
    setGithubBranch,
    githubToken,
    setGithubToken,
    loading: githubLoading,
    fetchGitHub,
    availableBranches,
    fetchingBranches
  } = useGitHubFetch(setUploadedFiles, setInputTab, setError, setSuccess);

  const loading = analysisLoading || githubLoading;

  // Calculate token estimate
  const getInputContent = useCallback(() => {
    if (inputTab === 'paste') return codeInput;
    if (inputTab === 'upload' || uploadedFiles.length > 0) {
      return uploadedFiles.map(f => `=== FILE: ${f.name} ===\n${f.content}`).join('\n\n');
    }
    return '';
  }, [inputTab, codeInput, uploadedFiles]);

  const estimatedTokens = Math.ceil(getInputContent().length / 4);
  const isTruncated = getInputContent().length > 100000;

  const handleAnalyze = async () => {
    const content = getInputContent();
    const modelToUse = provider === 'lmstudio' && selectedModel ? selectedModel : model;
    await analyzeCodebase(content, apiKey, config, modelToUse, provider, lmStudioUrl);
    // Refresh history after new analysis
    loadRecentAnalyses();
  };

  const clearAll = () => {
    setCodeInput('');
    clearFiles();
    setGithubUrl('');
    clearResults();
  };

  const canAnalyze = (provider === 'lmstudio' || apiKey) && (codeInput.trim() || uploadedFiles.length > 0);

  // Load user settings
  useEffect(() => {
    async function loadUserSettings() {
      if (status === 'loading' || !session || settingsLoaded) return;

      try {
        const response = await fetch('/api/user/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.claudeApiKey) setApiKey(data.claudeApiKey);
          if (data.lmStudioUrl) setLmStudioUrl(data.lmStudioUrl);
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    }

    loadUserSettings();
  }, [session, status, settingsLoaded]);

  // Load recent analyses
  const loadRecentAnalyses = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoadingHistory(true);
      const response = await fetch('/api/user/analyses?limit=5');
      if (response.ok) {
        const data = await response.json();
        setRecentAnalyses(data.analyses || []);
        setAnalysisStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error loading recent analyses:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [session]);

  useEffect(() => {
    loadRecentAnalyses();
  }, [loadRecentAnalyses]);

  // Format time ago
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-bg-dark">
      {/* Top Navigation Bar */}
      <div className="bg-surface-dark border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
            <Logo variant="full" color="blue" size="sm" />
          </div>

          <div className="flex items-center gap-4">
            <Avatar
              name={session?.user?.name || session?.user?.email || 'User'}
              size="sm"
            />
            <span className="hidden md:block text-sm text-text-secondary-dark font-secondary">
              {session?.user?.email}
            </span>
            <a
              href="/settings"
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary-dark hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline font-secondary">Settings</span>
            </a>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary-dark hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline font-secondary">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex max-w-[1800px] mx-auto">
        {/* History Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:sticky top-[57px] left-0 w-80 h-[calc(100vh-57px)] bg-surface-dark border-r border-white/10 overflow-y-auto transition-transform duration-300 z-40`}
        >
          {/* Stats Section */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold font-primary text-white">Overview</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary-dark" />
              </button>
            </div>

            {analysisStats ? (
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3 bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-primary" />
                    <p className="text-xs text-text-secondary-dark font-secondary">Analyses</p>
                  </div>
                  <p className="text-2xl font-bold text-white font-primary">
                    {analysisStats.total || 0}
                  </p>
                </Card>

                <Card className="p-3 bg-accent/5 border-accent/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-accent" />
                    <p className="text-xs text-text-secondary-dark font-secondary">Tokens</p>
                  </div>
                  <p className="text-xl font-bold text-white font-primary">
                    {((analysisStats.totalTokens || 0) / 1000).toFixed(1)}K
                  </p>
                </Card>
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-text-secondary-dark animate-spin" />
              </div>
            )}
          </div>

          {/* Recent Analyses */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white font-primary">Recent</h3>
              <a
                href="/history"
                className="text-xs text-primary hover:text-primary-hover transition-colors font-secondary"
              >
                View All
              </a>
            </div>

            {loadingHistory ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentAnalyses.length > 0 ? (
              <div className="space-y-2">
                {recentAnalyses.map((analysis) => (
                  <Card
                    key={analysis.id}
                    className="p-3 hover:bg-white/5 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Tag
                          size="sm"
                          className={analysis.provider === 'claude' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}
                        >
                          {analysis.provider === 'claude' ? '⚡' : '🤖'} {analysis.provider}
                        </Tag>
                      </div>
                      <span className="text-xs text-text-secondary-dark font-secondary">
                        {timeAgo(analysis.created_at)}
                      </span>
                    </div>

                    <p className="text-sm text-white font-secondary mb-1 truncate">
                      {analysis.input_type === 'github' && analysis.github_url
                        ? analysis.github_url.split('/').slice(-2).join('/')
                        : analysis.input_type === 'file'
                        ? 'File Upload'
                        : 'Code Paste'}
                    </p>

                    {analysis.token_usage && (
                      <p className="text-xs text-text-secondary-dark font-secondary">
                        {(analysis.token_usage.input_tokens || 0).toLocaleString()} tokens
                      </p>
                    )}

                    <ChevronRight className="w-4 h-4 text-text-secondary-dark opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3" />
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={History}
                title="No analyses yet"
                description="Your recent analyses will appear here"
                size="sm"
              />
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          {/* Main Tabs */}
          <Tabs defaultIndex={0} className="mb-6">
            <TabList>
              <TabButton>Input</TabButton>
              <TabButton>Configure</TabButton>
              <TabButton>Results</TabButton>
            </TabList>

            <TabPanels>
              {/* Input Tab */}
              <TabPanel>
                <InputSection
                  inputTab={inputTab}
                  setInputTab={setInputTab}
                  codeInput={codeInput}
                  setCodeInput={setCodeInput}
                  githubUrl={githubUrl}
                  setGithubUrl={setGithubUrl}
                  githubBranch={githubBranch}
                  setGithubBranch={setGithubBranch}
                  githubToken={githubToken}
                  setGithubToken={setGithubToken}
                  fetchGitHub={fetchGitHub}
                  uploadedFiles={uploadedFiles}
                  setUploadedFiles={setUploadedFiles}
                  isDragging={isDragging}
                  setIsDragging={setIsDragging}
                  handleDrop={handleDrop}
                  handleFileSelect={handleFileSelect}
                  loading={loading}
                  estimatedTokens={estimatedTokens}
                  isTruncated={isTruncated}
                  availableBranches={availableBranches}
                  fetchingBranches={fetchingBranches}
                />
              </TabPanel>

              {/* Configure Tab */}
              <TabPanel>
                <ConfigSection config={config} setConfig={setConfig} />

                <ApiKeyInput
                  provider={provider}
                  setProvider={setProvider}
                  apiKey={apiKey}
                  setApiKey={setApiKey}
                  lmStudioUrl={lmStudioUrl}
                  setLmStudioUrl={setLmStudioUrl}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  model={model}
                />
              </TabPanel>

              {/* Results Tab */}
              <TabPanel>
                {results ? (
                  <OutputSection results={results} />
                ) : (
                  <EmptyState
                    icon={Sparkles}
                    title="No results yet"
                    description="Configure your analysis and click 'Analyze Code' to generate QA artifacts"
                  />
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <Button
              variant="primary"
              size="lg"
              onClick={handleAnalyze}
              disabled={!canAnalyze || loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Analyze Code</span>
                </>
              )}
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={clearAll}
              disabled={loading}
            >
              Clear All
            </Button>
          </div>

          {/* Token Usage Display */}
          {tokenUsage && (
            <Card className="p-4 bg-surface-dark/50">
              <div className="flex items-center justify-center gap-6 text-sm font-secondary">
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary-dark">Input:</span>
                  <span className="text-primary font-semibold">
                    {tokenUsage.input_tokens?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary-dark">Output:</span>
                  <span className="text-accent font-semibold">
                    {tokenUsage.output_tokens?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center mt-8 text-xs text-text-secondary-dark font-secondary">
            Built with Claude AI • Your API key is never stored
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
